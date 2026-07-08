import { AiReviewFlag } from "@/lib/core/ai-review/types";

/**
 * Transcript PII sanitization.
 *
 * Beneficiary conversations contain names and other PII. Before a transcript is
 * sent to an external AI provider we replace speaker names with neutral
 * placeholders (SPEAKER_1..N). Flag offsets returned by the model refer to the
 * SANITIZED text, so we also provide restoreFlagOffsets() to map them back onto
 * the original transcript for the UI.
 *
 * NOTE: this reduces but does not eliminate PII exposure (free-text utterances
 * may still contain identifiers). A BAA with the AI provider remains a
 * production prerequisite — see docs/COMPLIANCE_RULES.md.
 */

export interface Replacement {
  original: string;
  placeholder: string;
  start: number; // offset in the ORIGINAL transcript
  end: number; // offset in the ORIGINAL transcript
}

export interface SanitizeResult {
  sanitized: string;
  replacements: Replacement[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace each unique speaker name with a stable placeholder. Matching is
 * case-insensitive and word-boundary aware. Replacements are applied
 * right-to-left so recorded original-offsets stay valid as we mutate the string.
 */
export function sanitizeTranscript(transcript: string, speakerNames: string[]): SanitizeResult {
  const uniqueNames = Array.from(
    new Set(speakerNames.map((n) => n.trim()).filter((n) => n.length > 0))
  );

  // Assign a stable placeholder per unique name (longest first so e.g. a full
  // name is matched before a first name that is a substring of it).
  uniqueNames.sort((a, b) => b.length - a.length);
  const placeholderByName = new Map<string, string>();
  uniqueNames.forEach((name, i) => placeholderByName.set(name, `SPEAKER_${i + 1}`));

  // Collect all matches across all names, then apply right-to-left.
  const matches: Replacement[] = [];
  for (const name of uniqueNames) {
    const placeholder = placeholderByName.get(name)!;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(transcript)) !== null) {
      matches.push({ original: m[0], placeholder, start: m.index, end: m.index + m[0].length });
      if (m.index === re.lastIndex) re.lastIndex++; // guard against zero-width
    }
  }

  matches.sort((a, b) => b.start - a.start);
  let sanitized = transcript;
  for (const match of matches) {
    sanitized = sanitized.slice(0, match.start) + match.placeholder + sanitized.slice(match.end);
  }

  // Return replacements in document order for stable downstream reasoning.
  matches.sort((a, b) => a.start - b.start);
  return { sanitized, replacements: matches };
}

/**
 * Map flag offsets from the sanitized transcript back onto the original.
 * Each replacement shifts everything after it by (placeholder.length - original.length).
 */
export function restoreFlagOffsets(flags: AiReviewFlag[], replacements: Replacement[]): AiReviewFlag[] {
  if (replacements.length === 0) return flags;

  // Build a list of edits in SANITIZED space with the cumulative delta applied.
  // Walk replacements in document order tracking the running offset delta.
  const inSanitized = [...replacements].sort((a, b) => a.start - b.start);

  function originalToSanitized(originalOffset: number): number {
    let delta = 0;
    for (const r of inSanitized) {
      if (r.start < originalOffset) {
        delta += r.placeholder.length - r.original.length;
      }
    }
    return originalOffset + delta;
  }

  function sanitizedToOriginal(sanitizedOffset: number): number {
    // Invert: find original offset whose sanitized image is closest at/below.
    let delta = 0;
    for (const r of inSanitized) {
      const rSanitizedStart = originalToSanitized(r.start);
      if (rSanitizedStart < sanitizedOffset) {
        delta += r.placeholder.length - r.original.length;
      }
    }
    return sanitizedOffset - delta;
  }

  return flags.map((flag) => {
    const start = sanitizedToOriginal(flag.transcript_offset_start);
    const end = sanitizedToOriginal(flag.transcript_offset_end);
    // If the quoted text equals a placeholder, restore the original name.
    const placeholderHit = inSanitized.find((r) => r.placeholder === flag.quoted_text);
    return {
      ...flag,
      transcript_offset_start: Math.max(0, start),
      transcript_offset_end: Math.max(0, end),
      quoted_text: placeholderHit ? placeholderHit.original : flag.quoted_text
    };
  });
}
