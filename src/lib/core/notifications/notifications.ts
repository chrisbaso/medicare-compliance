export type NotificationChannel = "in_app" | "email";

export interface NotificationMessage {
  organizationId: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  sourceEntityType: string;
  sourceEntityId: string;
}

export function createNotification(message: NotificationMessage) {
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "queued" as const,
    createdAt: new Date().toISOString(),
    ...message
  };
}
