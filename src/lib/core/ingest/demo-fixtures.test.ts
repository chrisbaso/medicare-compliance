import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectFormat, validateCsvAgainstFormat } from "./ingest-service";
import { parseCsv, decodeCsvBuffer } from "./csv-parser";
import { medicareCrmFormats } from "@/lib/verticals/medicare/crm-formats";
import { scoreClient } from "@/lib/verticals/medicare/opportunity-rules";

/**
 * The demo kit (docs/DEMO_VIDEO_SCRIPTS.md) promises specific on-screen behavior.
 * These tests pin that behavior so a future change can't silently break a live demo.
 */

const FIXTURES = join(__dirname, "../../../../test-fixtures");
const DEMO_REFERENCE_DATE = new Date(Date.UTC(2026, 6, 15));

function load(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

describe("demo-book.csv (clean demo file)", () => {
  const buffer = load("demo-book.csv");
  const format = detectFormat(
    parseCsv(decodeCsvBuffer(buffer).text).headers,
    medicareCrmFormats
  )!;
  const result = validateCsvAgainstFormat(buffer, format);

  it("auto-detects a matching format and validates with zero errors", () => {
    // These headers satisfy both signatures; either mapping imports identically.
    expect(["agency-export", "generic-csv"]).toContain(format.key);
    expect(result.errors).toEqual([]);
    expect(result.validRows).toHaveLength(15);
  });

  it("produces the signals the demo script narrates", () => {
    const signalsByClient = result.validRows.map((row) =>
      scoreClient(
        {
          clientId: `${row.first_name}-${row.last_name}`,
          dob: row.dob,
          status: row.status,
          tags: row.tags ?? [],
          note: row.note,
          lastConversationAt: null, // fresh import — no conversations yet
          hasSeparateRetirementConsent: false
        },
        DEMO_REFERENCE_DATE
      )
    );
    const allKeys = new Set(signalsByClient.flatMap((s) => s.signals.map((x) => x.ruleKey)));

    // The script points at these on screen:
    expect(allKeys).toContain("turning_65_window"); // Margaret, Walter, Pauline, Leon
    expect(allKeys).toContain("premium_pressure"); // Harold, Gloria
    expect(allKeys).toContain("life_event"); // Raymond (spouse), Ernest (CD)
    expect(allKeys).toContain("missing_document"); // Linda, Ruth
    expect(allKeys).toContain("service_need"); // Doris, Frank
    expect(allKeys).toContain("stale_contact"); // everyone: no conversations yet

    // Compliance guarantee shown in the demo: retirement interest WITHOUT
    // separate consent must produce NO retirement follow-up signal.
    expect(allKeys).not.toContain("consented_retirement_follow_up");
  });
});

describe("demo-book-with-errors.csv (validation demo file)", () => {
  const buffer = load("demo-book-with-errors.csv");
  const format = detectFormat(
    parseCsv(decodeCsvBuffer(buffer).text).headers,
    medicareCrmFormats
  )!;
  const result = validateCsvAgainstFormat(buffer, format);

  it("reports exactly the errors the training script points at", () => {
    const messagesByRow = new Map<number, string[]>();
    for (const e of result.errors) {
      messagesByRow.set(e.rowNumber, [...(messagesByRow.get(e.rowNumber) ?? []), e.message]);
    }
    expect(messagesByRow.get(3)?.join(" ")).toMatch(/Invalid value for 'dob'/); // not-a-date
    expect(messagesByRow.get(4)?.join(" ")).toMatch(/Invalid value for 'dob'/); // 3/40/1950
    expect(messagesByRow.get(5)?.join(" ")).toMatch(/Missing required value for 'first_name'/);
    expect(messagesByRow.get(6)?.join(" ")).toMatch(/Invalid email/);
    expect(messagesByRow.get(7)?.join(" ")).toMatch(/Unknown state 'XX'/);
  });

  it("keeps the two clean rows importable so the contrast is visible on screen", () => {
    expect(result.validRows.length).toBeGreaterThanOrEqual(2);
    expect(result.validRows[0].first_name).toBe("Margaret");
  });
});
