import { describe, it, expect } from "vitest";
import { parseCsv, decodeCsvBuffer, normalizeHeader } from "./csv-parser";
import {
  detectFormat,
  validateCsvAgainstFormat,
  commitIngest,
  normalizeUsDate,
  identityKey,
  findInFileDuplicates,
  findExistingDuplicates
} from "./ingest-service";
import { medicareCrmFormats, getMedicareCrmFormat } from "@/lib/verticals/medicare/crm-formats";
import { AppSupabaseClient } from "@/lib/core/repositories/operations-repository";

const enc = (s: string) => new TextEncoder().encode(s);
const generic = getMedicareCrmFormat("generic-csv")!;

describe("parseCsv", () => {
  it("parses quoted cells with embedded commas and quotes", () => {
    const { headers, rows } = parseCsv('a,b\n"Smith, Jr.","She said ""hi"""\n');
    expect(headers).toEqual(["a", "b"]);
    expect(rows[0]).toEqual(['Smith, Jr.', 'She said "hi"']);
  });

  it("handles CRLF, blank lines, and missing trailing newline", () => {
    const { rows } = parseCsv("a,b\r\n1,2\r\n\r\n3,4");
    expect(rows).toEqual([["1", "2"], ["3", "4"]]);
  });

  it("warns instead of throwing on an unterminated quote", () => {
    const { warnings } = parseCsv('a\n"unterminated');
    expect(warnings.some((w) => w.includes("quoted cell"))).toBe(true);
  });
});

describe("decodeCsvBuffer", () => {
  it("passes valid UTF-8 through and strips a BOM", () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...enc("a,b")]);
    const { text, encoding } = decodeCsvBuffer(bom);
    expect(text).toBe("a,b");
    expect(encoding).toBe("utf-8-bom");
  });

  it("detects Windows-1252 bytes and transcodes (e.g. é as 0xE9)", () => {
    const cp1252 = new Uint8Array([...enc("name\nRen"), 0xe9]); // "René" in cp1252
    const { text, encoding } = decodeCsvBuffer(cp1252);
    expect(encoding).toBe("windows-1252");
    expect(text).toContain("René");
  });
});

describe("normalizeUsDate", () => {
  it("normalizes US and ISO formats", () => {
    expect(normalizeUsDate("7/4/1958")).toBe("1958-07-04");
    expect(normalizeUsDate("1958-07-04")).toBe("1958-07-04");
  });
  it("throws on garbage and out-of-range dates", () => {
    expect(() => normalizeUsDate("not a date")).toThrow();
    expect(() => normalizeUsDate("13/40/1958")).toThrow();
  });
});

describe("detectFormat", () => {
  it("detects each of the four registered formats from its signature headers", () => {
    const samples: Record<string, string[]> = {
      "enrollment-platform": ["Beneficiary First", "Beneficiary Last", "Residence State"],
      "legacy-database": ["fname", "lname", "birth_date", "st"],
      "agency-export": ["First Name", "Last Name", "DOB"],
      "generic-csv": ["first_name", "last_name", "state"]
    };
    for (const [key, headers] of Object.entries(samples)) {
      expect(detectFormat(headers, medicareCrmFormats)?.key, `headers ${headers}`).toBe(key);
    }
  });

  it("returns null for unrecognizable headers", () => {
    expect(detectFormat(["foo", "bar"], medicareCrmFormats)).toBeNull();
  });

  it("normalizeHeader tolerates case/punctuation variants", () => {
    expect(normalizeHeader("First Name")).toBe(normalizeHeader("FIRST_NAME"));
  });
});

describe("validateCsvAgainstFormat", () => {
  it("accepts a clean file and normalizes fields", () => {
    const csv = "first_name,last_name,state,dob,email\nMargaret,Ellis,il,7/18/1961,m@example.com\n";
    const result = validateCsvAgainstFormat(enc(csv), generic);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0]).toMatchObject({
      first_name: "Margaret",
      last_name: "Ellis",
      state: "IL",
      dob: "1961-07-18",
      status: generic.defaultStatus
    });
  });

  it("fails loudly at file level when a required column is missing from the header", () => {
    const csv = "first_name,last_name\nA,B\n"; // no state column
    const result = validateCsvAgainstFormat(enc(csv), generic);
    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].message).toMatch(/Required column for 'state'/);
  });

  it("reports per-row errors with row numbers and keeps good rows separate", () => {
    const csv = [
      "first_name,last_name,state,dob,email",
      "Good,Row,IL,1/2/1955,g@example.com",
      ",MissingFirst,IL,,",
      "Bad,State,XX,,",
      "Bad,Email,IL,,not-an-email"
    ].join("\n");
    const result = validateCsvAgainstFormat(enc(csv), generic);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors.map((e) => e.rowNumber).sort()).toEqual([2, 3, 4]);
    expect(result.errors.find((e) => e.rowNumber === 3)?.message).toMatch(/Unknown state/);
  });

  it("surfaces an encoding warning for transcoded files", () => {
    const csv = new Uint8Array([...enc("first_name,last_name,state\nRen"), 0xe9, ...enc(",Smith,IL\n")]);
    const result = validateCsvAgainstFormat(csv, generic);
    expect(result.warnings.some((w) => w.includes("windows-1252"))).toBe(true);
    expect(result.validRows[0].first_name).toBe("René");
  });
});

describe("commitIngest", () => {
  function fakeSupabase(capture: { records?: unknown[] }) {
    return {
      from(table: string) {
        expect(table).toBe("clients");
        return {
          insert(records: unknown[], _opts: unknown) {
            capture.records = records;
            return Promise.resolve({ error: null, count: records.length });
          }
        };
      }
    } as unknown as AppSupabaseClient;
  }

  it("refuses to commit when any row error exists (all-or-nothing)", async () => {
    const supabase = fakeSupabase({});
    await expect(
      commitIngest(supabase, "org-1", {
        formatKey: "generic-csv",
        totalRows: 2,
        validRows: [{ first_name: "A", last_name: "B", state: "IL", status: "watch" }],
        validRowNumbers: [1],
        errors: [{ rowNumber: 2, message: "bad" }],
        warnings: []
      })
    ).rejects.toThrow(/Refusing to commit/);
  });

  it("injects organization_id from the session on every record, never from the file", async () => {
    const capture: { records?: Array<Record<string, unknown>> } = {};
    const supabase = fakeSupabase(capture);
    const { inserted } = await commitIngest(supabase, "org-from-session", {
      formatKey: "generic-csv",
      totalRows: 1,
      validRows: [{ first_name: "A", last_name: "B", state: "IL", status: "watch" }],
      validRowNumbers: [1],
      errors: [],
      warnings: []
    });
    expect(inserted).toBe(1);
    expect(capture.records?.every((r) => r.organization_id === "org-from-session")).toBe(true);
  });
});

describe("duplicate detection", () => {
  const row = (overrides: Record<string, string> = {}) => ({
    first_name: "Harold",
    last_name: "Bennett",
    dob: "1954-02-09",
    state: "IL",
    status: "watch",
    ...overrides
  });

  it("identityKey normalizes case and punctuation", () => {
    expect(identityKey(row({ first_name: "HAROLD", last_name: "O'Bennett" }))).toBe(
      identityKey(row({ first_name: "harold", last_name: "obennett" }))
    );
  });

  it("flags in-file duplicates by name+DOB, email, and phone — first occurrence wins", () => {
    const rows = [
      row(),
      row(), // dup by identity
      row({ first_name: "Different", last_name: "Person", dob: "1960-01-01", email: "x@example.com" }),
      row({ first_name: "Other", last_name: "Name", dob: "1961-01-01", email: "X@EXAMPLE.COM" }), // dup by email
      row({ first_name: "Third", last_name: "Human", dob: "1962-01-01", phone: "(312) 555-0100" }),
      row({ first_name: "Fourth", last_name: "Being", dob: "1963-01-01", phone: "312-555-0100" }) // dup by phone
    ];
    const errors = findInFileDuplicates(rows);
    expect(errors.map((e) => e.rowNumber)).toEqual([2, 4, 6]);
    expect(errors[0].message).toMatch(/Duplicate of row 1/);
    expect(errors[1].message).toMatch(/same email/);
    expect(errors[2].message).toMatch(/same phone/);
  });

  it("maps in-file duplicate row numbers through validRowNumbers", () => {
    const rows = [row(), row()];
    const errors = findInFileDuplicates(rows, [3, 7]); // original file positions
    expect(errors[0].rowNumber).toBe(7);
    expect(errors[0].message).toMatch(/Duplicate of row 3/);
  });

  it("flags rows matching the existing book and leaves new clients alone", () => {
    const existing = [
      { first_name: "Harold", last_name: "Bennett", dob: "1954-02-09", email: null, phone: null },
      { first_name: "A", last_name: "B", dob: null, email: "linda@example.com", phone: null }
    ];
    const rows = [
      row(), // identity match
      row({ first_name: "New", last_name: "Person", dob: "1960-05-05", email: "linda@example.com" }), // email match
      row({ first_name: "Truly", last_name: "New", dob: "1961-06-06" })
    ];
    const hits = findExistingDuplicates(rows, existing);
    expect(hits.map((h) => h.rowNumber)).toEqual([1, 2]);
    expect(hits[0].message).toMatch(/name and DOB/);
    expect(hits[1].message).toMatch(/email/);
  });

  it("does not treat short/absent phones as a match key", () => {
    const rows = [
      row({ first_name: "A", last_name: "A", dob: "1950-01-01", phone: "555" }),
      row({ first_name: "B", last_name: "B", dob: "1951-01-01", phone: "555" })
    ];
    expect(findInFileDuplicates(rows)).toHaveLength(0);
  });
});
