import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/core/auth/session";
import { createServerClient } from "@/lib/core/supabase/server";
import {
  commitIngest,
  detectFormat,
  findExistingDuplicates,
  findInFileDuplicates,
  loadExistingIdentities,
  validateCsvAgainstFormat
} from "@/lib/core/ingest/ingest-service";
import { getMedicareCrmFormat, medicareCrmFormats } from "@/lib/verticals/medicare/crm-formats";

/**
 * Book-of-business CSV ingest.
 *
 * POST body (JSON):
 *   csvBase64  – file content, base64-encoded (preserves original bytes so
 *                Windows-1252 exports can be detected and transcoded)
 *   formatKey  – optional; omitted → auto-detect from headers
 *   dryRun     – default true; commit requires an explicit dryRun:false
 *
 * Behavior guarantees:
 *   - organization_id comes from the authenticated session, never the file
 *   - commit is all-or-nothing; any row error blocks the whole file
 *   - the file body is processed in-memory and never persisted or logged
 */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB ≈ tens of thousands of rows

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    csvBase64?: string;
    formatKey?: string;
    dryRun?: boolean;
    onDuplicate?: "error" | "skip";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!body.csvBase64 || typeof body.csvBase64 !== "string") {
    return NextResponse.json({ error: "csvBase64 is required." }, { status: 400 });
  }

  let buffer: Uint8Array;
  try {
    buffer = Uint8Array.from(Buffer.from(body.csvBase64, "base64"));
  } catch {
    return NextResponse.json({ error: "csvBase64 is not valid base64." }, { status: 400 });
  }
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes.` },
      { status: 400 }
    );
  }

  // Resolve the CRM format: explicit key wins, else auto-detect from headers.
  let format = body.formatKey ? getMedicareCrmFormat(body.formatKey) : undefined;
  if (body.formatKey && !format) {
    return NextResponse.json(
      {
        error: `Unknown formatKey '${body.formatKey}'.`,
        availableFormats: medicareCrmFormats.map((f) => ({ key: f.key, label: f.label }))
      },
      { status: 400 }
    );
  }
  if (!format) {
    const { decodeCsvBuffer, parseCsv } = await import("@/lib/core/ingest/csv-parser");
    const detected = detectFormat(parseCsv(decodeCsvBuffer(buffer).text).headers, medicareCrmFormats);
    if (!detected) {
      return NextResponse.json(
        {
          error: "Could not auto-detect the CRM format from the file headers.",
          availableFormats: medicareCrmFormats.map((f) => ({ key: f.key, label: f.label }))
        },
        { status: 422 }
      );
    }
    format = detected;
  }

  const validation = validateCsvAgainstFormat(buffer, format);
  const dryRun = body.dryRun !== false; // default true — committing is explicit
  const onDuplicate = body.onDuplicate === "skip" ? "skip" : "error";

  // In-file duplicates are ALWAYS errors: which copy wins is ambiguous.
  validation.errors.push(...findInFileDuplicates(validation.validRows, validation.validRowNumbers));

  // Duplicates against the existing book: error by default; explicit skip for re-imports.
  let skippedDuplicates = 0;
  const supabase = await createServerClient();
  const existing = await loadExistingIdentities(supabase);
  const existingHits = findExistingDuplicates(validation.validRows, existing, validation.validRowNumbers);
  if (existingHits.length > 0) {
    if (onDuplicate === "skip") {
      const skipRows = new Set(existingHits.map((h) => h.rowNumber));
      const keptRows: typeof validation.validRows = [];
      const keptNumbers: number[] = [];
      validation.validRows.forEach((row, i) => {
        if (skipRows.has(validation.validRowNumbers[i])) return;
        keptRows.push(row);
        keptNumbers.push(validation.validRowNumbers[i]);
      });
      skippedDuplicates = validation.validRows.length - keptRows.length;
      validation.validRows = keptRows;
      validation.validRowNumbers = keptNumbers;
      validation.warnings.push(`${skippedDuplicates} row(s) skipped: already in the book.`);
    } else {
      validation.errors.push(...existingHits);
    }
  }

  const summary = {
    formatKey: validation.formatKey,
    totalRows: validation.totalRows,
    validRowCount: validation.validRows.length,
    errorCount: validation.errors.length,
    errors: validation.errors.slice(0, 100), // cap the report size
    warnings: validation.warnings,
    skippedDuplicates,
    dryRun
  };

  if (dryRun) {
    return NextResponse.json({ ...summary, committed: false });
  }

  if (validation.errors.length > 0) {
    return NextResponse.json(
      { ...summary, committed: false, error: "Row errors present; commit refused (all-or-nothing)." },
      { status: 422 }
    );
  }

  const { inserted } = await commitIngest(supabase, currentUser.organizationId, validation);
  return NextResponse.json({ ...summary, committed: true, inserted });
}
