/**
 * Book-of-business ingest contracts (substrate — vertical-agnostic).
 * Vertical packs supply CrmFormat definitions; the core service applies them.
 */

// The canonical fields an ingest row can populate on a client record.
export interface CanonicalClientRow {
  first_name: string;
  last_name: string;
  dob?: string; // ISO yyyy-mm-dd
  phone?: string;
  email?: string;
  state: string; // 2-letter US state
  preferred_contact_method?: string;
  status: string;
  tags?: string[];
  note?: string;
}

export interface ColumnMapping {
  /** Canonical field this column feeds. */
  field: keyof CanonicalClientRow;
  /** Normalized header aliases that identify this column (see normalizeHeader). */
  aliases: string[];
  required?: boolean;
  /** Optional cell transform (e.g. date normalization). */
  transform?: (raw: string) => string;
}

export interface CrmFormat {
  key: string;
  label: string;
  /** Normalized headers that must ALL be present for auto-detection. */
  signatureHeaders: string[];
  columns: ColumnMapping[];
  /** Default status assigned when the format has no status column. */
  defaultStatus: string;
}

export interface RowError {
  rowNumber: number; // 1-based data-row number (excludes header)
  message: string;
}

export interface IngestValidationResult {
  formatKey: string;
  totalRows: number;
  validRows: CanonicalClientRow[];
  errors: RowError[];
  warnings: string[];
}
