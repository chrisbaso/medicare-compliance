import { ConsentRecord, ConsentStatus, ConsentType } from "@/lib/types";

export interface ConsentLedgerInput {
  clientId: string;
  conversationId?: string;
  followupWorkflowId?: string;
  linkedOpportunityId?: string;
  consentType: ConsentType;
  status: ConsentStatus;
  captureMethod: string;
  evidenceRef: string;
  evidenceComplete: boolean;
  notes: string;
}

export function createConsentRecord(input: ConsentLedgerInput, now = new Date()): ConsentRecord {
  return {
    id: `consent-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId: input.clientId,
    conversationId: input.conversationId,
    followupWorkflowId: input.followupWorkflowId,
    linkedOpportunityId: input.linkedOpportunityId,
    consentType: input.consentType,
    status: input.status,
    capturedAt: now.toISOString(),
    captureMethod: input.captureMethod,
    evidenceRef: input.evidenceRef,
    evidenceComplete: input.evidenceComplete,
    notes: input.notes
  };
}

export function createRevocationRecord(
  existing: ConsentRecord,
  reason: string,
  now = new Date()
): ConsentRecord {
  return createConsentRecord(
    {
      clientId: existing.clientId,
      conversationId: existing.conversationId,
      followupWorkflowId: existing.followupWorkflowId,
      linkedOpportunityId: existing.linkedOpportunityId,
      consentType: existing.consentType,
      status: "revoked",
      captureMethod: "revocation",
      evidenceRef: existing.evidenceRef,
      evidenceComplete: true,
      notes: reason
    },
    now
  );
}

export function getLatestConsentStatus(records: ConsentRecord[], consentType: ConsentType) {
  const latest = records
    .filter((record) => record.consentType === consentType)
    .slice()
    .sort((left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt))[0];

  return latest?.status ?? "pending";
}

export function hasGrantedConsent(records: ConsentRecord[], consentType: ConsentType) {
  const latestStatus = getLatestConsentStatus(records, consentType);
  const latest = records
    .filter((record) => record.consentType === consentType)
    .slice()
    .sort((left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt))[0];

  return latestStatus === "granted" && Boolean(latest?.evidenceComplete);
}
