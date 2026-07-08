import { CrmFormat } from "@/lib/core/ingest/types";
import { normalizeUsDate } from "@/lib/core/ingest/ingest-service";

/**
 * Medicare CRM export formats (vertical pack).
 *
 * Each format declares the normalized headers that identify it and how its
 * columns map onto the canonical client row. Aliases are matched after
 * normalizeHeader() (lowercase, alphanumeric only) so "First Name",
 * "first_name", and "FIRST-NAME" all resolve identically.
 */

const agencyExportFormat: CrmFormat = {
  key: "agency-export",
  label: "Agency management export (First Name / Last Name / DOB)",
  signatureHeaders: ["firstname", "lastname", "dob"],
  defaultStatus: "active_review",
  columns: [
    { field: "first_name", aliases: ["firstname"], required: true },
    { field: "last_name", aliases: ["lastname"], required: true },
    { field: "dob", aliases: ["dob", "dateofbirth"], transform: normalizeUsDate },
    { field: "phone", aliases: ["phone", "phonenumber", "primaryphone"] },
    { field: "email", aliases: ["email", "emailaddress"] },
    { field: "state", aliases: ["state", "st"], required: true },
    { field: "status", aliases: ["status", "clientstatus"] },
    { field: "note", aliases: ["note", "notes", "comments"] }
  ]
};

const enrollmentPlatformFormat: CrmFormat = {
  key: "enrollment-platform",
  label: "Enrollment platform export (Beneficiary First / Beneficiary Last)",
  signatureHeaders: ["beneficiaryfirst", "beneficiarylast", "residencestate"],
  defaultStatus: "active_review",
  columns: [
    { field: "first_name", aliases: ["beneficiaryfirst"], required: true },
    { field: "last_name", aliases: ["beneficiarylast"], required: true },
    { field: "dob", aliases: ["dateofbirth", "birthdate"], transform: normalizeUsDate },
    { field: "phone", aliases: ["primaryphone", "phone"] },
    { field: "email", aliases: ["emailaddress", "email"] },
    { field: "state", aliases: ["residencestate"], required: true },
    { field: "note", aliases: ["planNotes", "plannotes", "notes"] }
  ]
};

const legacyDatabaseFormat: CrmFormat = {
  key: "legacy-database",
  label: "Legacy database export (fname / lname / birth_date)",
  signatureHeaders: ["fname", "lname", "birthdate"],
  defaultStatus: "watch",
  columns: [
    { field: "first_name", aliases: ["fname"], required: true },
    { field: "last_name", aliases: ["lname"], required: true },
    { field: "dob", aliases: ["birthdate"], transform: normalizeUsDate },
    { field: "phone", aliases: ["phonenumber", "phone"] },
    { field: "email", aliases: ["email"] },
    { field: "state", aliases: ["st", "state"], required: true },
    { field: "status", aliases: ["clientstatus", "status"] },
    { field: "tags", aliases: ["tags", "categories"] }
  ]
};

const genericCsvFormat: CrmFormat = {
  key: "generic-csv",
  label: "Generic CSV (first_name / last_name / state)",
  signatureHeaders: ["firstname", "lastname", "state"],
  defaultStatus: "active_review",
  columns: [
    { field: "first_name", aliases: ["firstname"], required: true },
    { field: "last_name", aliases: ["lastname"], required: true },
    { field: "dob", aliases: ["dob", "dateofbirth"], transform: normalizeUsDate },
    { field: "phone", aliases: ["phone"] },
    { field: "email", aliases: ["email"] },
    { field: "state", aliases: ["state"], required: true },
    { field: "status", aliases: ["status"] },
    { field: "note", aliases: ["note", "notes"] }
  ]
};

// Order matters only for ties; detectFormat prefers the most specific signature.
export const medicareCrmFormats: CrmFormat[] = [
  enrollmentPlatformFormat,
  legacyDatabaseFormat,
  agencyExportFormat,
  genericCsvFormat
];

export function getMedicareCrmFormat(key: string): CrmFormat | undefined {
  return medicareCrmFormats.find((f) => f.key === key);
}
