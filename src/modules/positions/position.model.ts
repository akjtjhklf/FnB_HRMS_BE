export interface Position {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const POSITIONS_COLLECTION = "positions";
