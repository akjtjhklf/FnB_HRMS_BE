export interface RFIDCard {
  id: string; // UUID
  employee_id?: string | null; // UUID -> employees(id)
  card_uid: string;
  issued_at?: string | null;
  revoked_at?: string | null;
  status: "active" | "suspended" | "lost" | "revoked";
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const RFID_CARDS_COLLECTION = "rfid_cards";
