"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { medicareCrmFormats } from "@/lib/verticals/medicare/crm-formats";

/**
 * Guided book-of-business onboarding: upload → detect → dry-run preview →
 * explicit commit. The file is sent once per action and never stored; the
 * server validates every row and refuses partial imports.
 */

interface IngestSummary {
  formatKey: string;
  totalRows: number;
  validRowCount: number;
  errorCount: number;
  errors: { rowNumber: number; message: string }[];
  warnings: string[];
  committed: boolean;
  inserted?: number;
  error?: string;
}

type Step = "select" | "previewed" | "committed";

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export default function OnboardingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [formatKey, setFormatKey] = useState<string>("");
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  async function runIngest(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    setRequestError(null);
    try {
      const csvBase64 = await fileToBase64(file);
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvBase64,
          ...(formatKey ? { formatKey } : {}),
          onDuplicate: skipDuplicates ? "skip" : "error",
          dryRun
        })
      });
      const body = (await response.json()) as IngestSummary & { error?: string };
      if (!response.ok && !body.totalRows) {
        setRequestError(body.error ?? `Request failed (${response.status}).`);
        return;
      }
      setSummary(body);
      setStep(body.committed ? "committed" : "previewed");
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const canCommit = step === "previewed" && summary !== null && summary.errorCount === 0 && summary.validRowCount > 0;

  return (
    <>
      <PageHeader
        title="Book onboarding"
        description="Import a book of business from a CRM export. Every row is validated first; the import is all-or-nothing, and the uploaded file is processed in memory only — it is never stored."
      />

      <Card>
        <CardHeader
          eyebrow="Step 1"
          title="Choose the export file"
          description="CSV exports from supported CRM systems are auto-detected from their headers. You can also pick the format explicitly."
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            <span className="font-medium">CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setSummary(null);
                setStep("select");
              }}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            <span className="font-medium">CRM format</span>
            <select
              value={formatKey}
              onChange={(e) => setFormatKey(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2"
            >
              <option value="">Auto-detect from headers</option>
              {medicareCrmFormats.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span>Re-import: skip clients already in the book</span>
          </label>
          <Button disabled={!file || busy} onClick={() => runIngest(true)}>
            {busy && step === "select" ? "Validating…" : "Validate (dry run)"}
          </Button>
        </div>
        {requestError ? <p className="mt-4 text-sm text-rose-700">{requestError}</p> : null}
      </Card>

      {summary ? (
        <Card className="mt-6">
          <CardHeader
            eyebrow="Step 2"
            title={summary.committed ? "Import complete" : "Dry-run preview"}
            description={
              summary.committed
                ? `Inserted ${summary.inserted} client record(s).`
                : "Nothing has been imported yet. Review the validation report, then commit."
            }
          />
          <div className="flex flex-wrap gap-3">
            <Badge value={`Format: ${summary.formatKey}`} tone="info" />
            <Badge value={`${summary.totalRows} rows`} tone="neutral" />
            <Badge value={`${summary.validRowCount} valid`} tone="success" />
            <Badge
              value={`${summary.errorCount} errors`}
              tone={summary.errorCount > 0 ? "danger" : "neutral"}
            />
          </div>

          {summary.warnings.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-amber-700">
              {summary.warnings.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          ) : null}

          {summary.errors.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-rose-700">
                Row errors (import is refused until these are fixed — all-or-nothing):
              </p>
              <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm text-stone-700">
                {summary.errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-mono text-xs text-stone-500">
                      {e.rowNumber === 0 ? "file" : `row ${e.rowNumber}`}
                    </span>{" "}
                    {e.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {canCommit ? (
            <div className="mt-6">
              <Button disabled={busy} onClick={() => runIngest(false)}>
                {busy ? "Importing…" : `Commit import (${summary.validRowCount} clients)`}
              </Button>
              <p className="mt-2 text-xs text-stone-500">
                Records import into your organization only. This action is logged.
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
