export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId: string;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  source: string;
}

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  at: string;
  data?: Record<string, unknown>;
}

export function createCorrelationId(prefix = "corr") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function writeLog(entry: Omit<StructuredLogEntry, "at">) {
  const payload: StructuredLogEntry = {
    ...entry,
    at: new Date().toISOString()
  };

  const writer = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
  writer(JSON.stringify(payload));
}
