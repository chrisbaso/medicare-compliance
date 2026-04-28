import { AuditEvent, ConsentStatus } from "@/lib/types";

export interface AuditActor {
  userId: string;
  role: string;
}

export interface AuditInput {
  organizationId: string;
  entityType: AuditEvent["entityType"];
  entityId: string;
  action: string;
  actor: AuditActor;
  source: "ui" | "api" | "migration" | "system" | "ai_review";
  detail: string;
  beforeState?: unknown;
  afterState?: unknown;
  consentStatus?: ConsentStatus | "missing" | "not_required";
  nextAction?: string;
  correlationId: string;
}

export interface DurableAuditEvent extends AuditEvent {
  organizationId: string;
  source: AuditInput["source"];
  beforeState?: unknown;
  afterState?: unknown;
  correlationId: string;
}

export function createAuditEvent(input: AuditInput): DurableAuditEvent {
  return {
    id: `audit-${input.correlationId}`,
    organizationId: input.organizationId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorUserId: input.actor.userId,
    eventAt: new Date().toISOString(),
    detail: input.detail,
    sourceContext: input.source,
    consentStatusSnapshot: input.consentStatus,
    nextAction: input.nextAction,
    source: input.source,
    beforeState: input.beforeState,
    afterState: input.afterState,
    correlationId: input.correlationId
  };
}

export function assertAuditRecordAppendOnly() {
  return {
    policy: "Audit records are append-only. Corrections must be represented as new audit events.",
    prohibitedOperations: ["update", "delete"]
  };
}
