export interface Device {
  id: string; // UUID
  name: string;
  location?: string | null;
  device_key: string;
  ip_address?: string | null;
  mac_address?: string | null;
  firmware_version?: string | null;
  last_seen_at?: string | null;
  status: "online" | "offline" | "decommissioned";
  current_mode: "attendance" | "enroll";
  employee_id_pending?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const DEVICES_COLLECTION = "devices";
