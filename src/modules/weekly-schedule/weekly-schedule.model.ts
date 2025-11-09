export interface WeeklySchedule {
  id: string; // UUID
  week_start: string; // ISO date
  week_end: string; // ISO date
  created_by?: string | null; // directus_users.id
  status: "draft" | "scheduled" | "finalized" | "cancelled";
  published_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const WEEKLY_SCHEDULE_COLLECTION = "weekly_schedules";
