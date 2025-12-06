export interface Position {
  id: string;
  name: string;
  description?: string | null;
  is_priority?: boolean | null; // Đánh dấu vị trí quan trọng (Pha chế, Bếp trưởng...)
  created_at?: string | null;
  updated_at?: string | null;
}

export const POSITIONS_COLLECTION = "positions";
