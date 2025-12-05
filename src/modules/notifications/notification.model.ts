export interface Notification {
  id: string;
  title: string;
  message: string;
  body?: string | null; // Alias for message (FE compatibility)
  level?: "info" | "warning" | "error" | "success" | null;
  action_url?: string | null;
  link?: string | null; // Alias for action_url
  recipient_type: "ALL" | "SPECIFIC";
  status: "draft" | "scheduled" | "sent" | "failed";
  user_ids?: string | null; // JSON array of employee IDs
  scheduled_at?: string | null;
  sent_at?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  metadata?: Record<string, any> | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const NOTIFICATIONS_COLLECTION = "notifications";

export const NOTIFICATION_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  SENT: "sent",
  FAILED: "failed",
} as const;

export const RECIPIENT_TYPE = {
  ALL: "ALL",
  SPECIFIC: "SPECIFIC",
} as const;
