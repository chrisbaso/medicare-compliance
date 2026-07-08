import { AppSupabaseClient } from "@/lib/core/repositories/operations-repository";
import { decodeCsvBuffer, normalizeHeader, parseCsv } from "@/lib/core/ingest/csv-parser";
import {
  CanonicalClientRow,
  CrmFormat,
  IngestValidationResult,
  RowError
} from "@/lib/core/ingest/types";

/**
 * Core ingest service (substrate). Detects the CRM format, validates every row,
 * and commits all-or-nothing. organization_id ALWAYS comes from the
 * authenticated session — never from file content.
 */

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR"
]);

/** Auto-detect which registered format matches the file's headers. */
export function detectFormat(headers: string[], formats: CrmFormat[]): CrmFormat | null {
  const normalized = new Set(headers.map(normalizeHeader));
  // Most-specific signature wins.
  const candidates = formats
    .filter((f) => f.signatureHeaders.every((sig) => normalized.has(sig)))
    .sort((a, b) => b.signatureHeaders.length - a.signatureHeaders.length);
  return candidates[0] ?? null;
}

export function validateCsvAgainstFormat(
  buffer: Uint8Array,
  format: CrmFormat
): IngestValidationResult {
  const { text, encoding } = decodeCsvBuffer(buffer);
  const parsed = parseCsv(text);
  const warnings = [...parsed.warnings];
  if (encoding !== "utf-8") {
    warnings.push(`File decoded as ${encoding} and transcoded to UTF-8.`);
  }

  const errors: RowError[] = [];
  const validRows: CanonicalClientRow[] = [];

  // Resolve each mapped column to a header index.
  const headerIndex = new Map<string, number>();
  parsed.headers.forEach((h, i) => headerIndex.set(normalizeHeader(h), i));

  const columnIndexes = format.columns.map((col) => {
    const idx = col.aliases.map((a) => headerIndex.get(a)).find((i) => i !== undefined);
    return { col, index: idx };
  });

  // A required column missing from the header is a file-level failure: fail
  // loudly rather than silently importing empty fields.
  const missingRequired = columnIndexes.filter((c) => c.col.required && c.index === undefined);
  if (missingRequired.length > 0) {
    return {
      formatKey: format.key,
      totalRows: parsed.rows.length,
      validRows: [],
      errors: missingRequired.map((c) => ({
        rowNumber: 0,
        message: `Required column for '${c.col.field}' not found in header (expected one of: ${c.col.aliases.join(", ")}).`
      })),
      warnings
    };
  }

  parsed.rows.forEach((cells, i) => {
    const rowNumber = i + 1;
    const row: Partial<CanonicalClientRow> = {};
    const rowErrors: string[] = [];

    for (const { col, index } of columnIndexes) {
      if (index === undefined) continue;
      const raw = (cells[index] ?? "").trim();
      if (raw === "") {
        if (col.required) rowErrors.push(`Missing required value for '${col.field}'.`);
        continue;
      }
      try {
        const value = col.transform ? col.transform(raw) : raw;
        if (col.field === "tags") {
          row.tags = value.split(/[;|]/).map((t) => t.trim()).filter(Boolean);
        } else {
          (row as Record<string, string>)[col.field] = value;
        }
      } catch (err) {
        rowErrors.push(`Invalid value for '${col.field}': ${err instanceof Error ? err.message : "unparseable"}.`);
      }
    }

    // Field-level validation.
    if (row.state && !US_STATES.has(row.state.toUpperCase())) {
      rowErrors.push(`Unknown state '${row.state}'.`);
    } else if (row.state) {
      row.state = row.state.toUpperCase();
    }
    if (row.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) {
      rowErrors.push(`Invalid email '${row.email}'.`);
    }
    if (row.dob && !/^\d{4}-\d{2}-\d{2}$/.test(row.dob)) {
      rowErrors.push(`DOB must normalize to yyyy-mm-dd (got '${row.dob}').`);
    }
    if (!row.status) row.status = format.defaultStatus;

    if (rowErrors.length > 0) {
      rowErrors.forEach((message) => errors.push({ rowNumber, message }));
    } else {
      validRows.push(row as CanonicalClientRow);
    }
  });

  return { formatKey: format.key, totalRows: parsed.rows.length, validRows, errors, warnings };
}

/**
 * Commit validated rows. ALL-OR-NOTHING: refuses to commit if any row failed
 * validation (a partial beneficiary import is worse than a failed one), and
 * the insert itself is a single statement (atomic in Postgres).
 */
export async function commitIngest(
  supabase: AppSupabaseClient,
  organizationId: string,
  validation: IngestValidationResult
): Promise<{ inserted: number }> {
  if (validation.errors.length > 0) {
    throw new Error(
      `Refusing to commit: ${validation.errors.length} row error(s) present. Fix the file or remove failing rows.`
    );
  }
  if (validation.validRows.length === 0) {
    return { inserted: 0 };
  }

  const records = validation.validRows.map((row) => ({
    organization_id: organizationId, // from session, never from the file
    first_name: row.first_name,
    last_name: row.last_name,
    dob: row.dob ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    state: row.state,
    preferred_contact_method: row.preferred_contact_method ?? "phone",
    status: row.status,
    tags: row.tags ?? [],
    note: row.note ?? null
  }));

  const { error, count } = await supabase.from("clients").insert(records, { count: "exact" });
  if (error) throw new Error(error.message);
  return { inserted: count ?? records.length };
}

/** Normalize common US date formats to ISO yyyy-mm-dd. Throws when unparseable. */
export function normalizeUsDate(raw: string): string {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const us = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  let y: number, m: number, d: number;
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (us) {
    [m, d, y] = [Number(us[1]), Number(us[2]), Number(us[3])];
  } else {
    throw new Error(`unrecognized date format '${raw}'`);
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`out-of-range date '${raw}'`);
  }
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}
