/**
 * CSV parsing for book-of-business ingest (substrate — vertical-agnostic).
 *
 * Handles the realities of Medicare CRM exports:
 * - RFC 4180 quoting (embedded commas, quotes, newlines in cells)
 * - CRLF and LF line endings, trailing newline, UTF-8 BOM
 * - Windows-1252 / Latin-1 exports (detected and transcoded to UTF-8)
 *
 * Parsing never throws on malformed cell content; structural problems are
 * reported per-row so the caller can produce an actionable error report.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][]; // data rows, same order as file
  warnings: string[];
}

/** Decode an uploaded buffer, detecting UTF-8 vs Windows-1252/Latin-1. */
export function decodeCsvBuffer(buffer: Uint8Array): { text: string; encoding: string } {
  // Strip UTF-8 BOM if present.
  const hasBom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const body = hasBom ? buffer.subarray(3) : buffer;

  const utf8 = new TextDecoder("utf-8", { fatal: false });
  const decoded = utf8.decode(body);
  // U+FFFD replacement chars signal the bytes were not valid UTF-8 →
  // re-decode as Windows-1252 (superset of Latin-1 for CRM exports).
  if (decoded.includes("�")) {
    const cp1252 = new TextDecoder("windows-1252");
    return { text: cp1252.decode(body), encoding: "windows-1252" };
  }
  return { text: decoded, encoding: hasBom ? "utf-8-bom" : "utf-8" };
}

/** RFC 4180-style CSV parse. Returns headers + rows; never throws on content. */
export function parseCsv(text: string): ParsedCsv {
  const warnings: string[] = [];
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    // Skip fully empty records (blank lines).
    if (record.length === 1 && record[0].trim() === "") {
      record = [];
      return;
    }
    records.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      pushField();
      pushRecord();
    } else if (ch === "\n") {
      pushField();
      pushRecord();
    } else {
      field += ch;
    }
  }
  // Flush a final unterminated record.
  if (field.length > 0 || record.length > 0) {
    pushField();
    pushRecord();
  }
  if (inQuotes) {
    warnings.push("File ended inside a quoted cell; the last field may be truncated.");
  }

  if (records.length === 0) {
    return { headers: [], rows: [], warnings: ["File contains no rows."] };
  }

  const headers = records[0].map((h) => h.trim());
  return { headers, rows: records.slice(1), warnings };
}

/** Normalize a header for tolerant matching: lowercase, alphanumeric only. */
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}
