import { ConsentRecord, ConsentStatus, ConsentType } from "@/lib/types";

export type ConsentCategory = "medicare" | "separate_follow_up";
export type ConsentTone = "neutral" | "success" | "warning" | "danger" | "info";

export function getConsentCategory(consentType: ConsentType): ConsentCategory {
  return consentType === "retirement_follow_up" ? "separate_follow_up" : "medicare";
}

export function getConsentCategoryLabel(consentType: ConsentType) {
  return getConsentCategory(consentType) === "separate_follow_up"
    ? "Separate follow-up consent"
    : "Medicare consent";
}

export function getConsentTypeLabel(consentType: ConsentType) {
  switch (consentType) {
    case "contact":
      return "Contact permission";
    case "recording":
      return "Call recording";
    case "soa":
      return "Scope of appointment";
    case "retirement_follow_up":
      return "Separate follow-up";
  }
}

export function getConsentStatusLabel(status: ConsentStatus, evidenceComplete = true) {
  if (status === "granted" && !evidenceComplete) {
    return "Evidence needed";
  }

  if (status === "expired") {
    return "Expired";
  }

  return status;
}

export function getConsentStatusTone(status: ConsentStatus, evidenceComplete = true): ConsentTone {
  if (status === "revoked" || status === "expired") {
    return "danger";
  }

  if (status === "pending" || !evidenceComplete) {
    return "warning";
  }

  if (status === "granted") {
    return "success";
  }

  return "neutral";
}

export function getConsentCategoryClasses(consentType: ConsentType) {
  return getConsentCategory(consentType) === "separate_follow_up"
    ? {
        container: "border-sky-200 bg-sky-50/70",
        label: "bg-sky-100 text-sky-800"
      }
    : {
        container: "border-stone-200 bg-stone-50/80",
        label: "bg-stone-200 text-stone-700"
      };
}

export function isConsentBlocked(record: Pick<ConsentRecord, "consentType" | "status" | "evidenceComplete">) {
  return getConsentCategory(record.consentType) === "separate_follow_up" &&
    (record.status !== "granted" || !record.evidenceComplete);
}

export function getConsentBlockerLabel(record: Pick<ConsentRecord, "consentType" | "status" | "evidenceComplete">) {
  if (!isConsentBlocked(record)) {
    return null;
  }

  if (record.status === "pending") {
    return "Separate follow-up blocked";
  }

  if (record.status === "revoked" || record.status === "expired") {
    return "Consent refresh required";
  }

  return "Consent required";
}

export function getConsentDisplay(record: Pick<ConsentRecord, "consentType" | "status" | "evidenceComplete">) {
  return {
    category: getConsentCategory(record.consentType),
    categoryLabel: getConsentCategoryLabel(record.consentType),
    typeLabel: getConsentTypeLabel(record.consentType),
    statusLabel: getConsentStatusLabel(record.status, record.evidenceComplete),
    tone: getConsentStatusTone(record.status, record.evidenceComplete),
    classes: getConsentCategoryClasses(record.consentType),
    isBlocked: isConsentBlocked(record),
    blockerLabel: getConsentBlockerLabel(record)
  };
}
