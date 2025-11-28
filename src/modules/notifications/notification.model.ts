export interface Notification {
  id: string;
  title: string;
  message: string;
  action_url?: string | null;
  recipient_type: "ALL" | "DEPARTMENT" | "SPECIFIC";
  status: "draft" | "scheduled" | "sent" | "failed";
  department_ids?: string | null; // JSON array
  user_ids?: string | null; // JSON array
  scheduled_at?: string | null;
  sent_at?: string | null;
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
  DEPARTMENT: "DEPARTMENT",
  SPECIFIC: "SPECIFIC",
} as const;
