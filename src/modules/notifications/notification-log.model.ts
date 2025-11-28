export interface NotificationLog {
  id: string;
  trigger_id: string; // Novu transaction ID
  notification_id?: string | null;
  title: string;
  content: string;
  channel: "in_app" | "email" | "sms" | "push";
  recipients: string; // JSON array
  workflow_id?: string | null;
  payload?: string | null; // JSON
  triggered_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const NOTIFICATION_LOGS_COLLECTION = "notification_logs";

export const NOTIFICATION_CHANNEL = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
} as const;
