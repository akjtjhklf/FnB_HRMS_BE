import { z } from "zod";
import { RFIDCard } from "./rfid-card.model";

// ====== SCHEMAS ======
export const createRFIDCardSchema = z.object({
  employee_id: z.uuid().nullable().optional(),
  card_uid: z.string().min(3, "Card UID không hợp lệ"),
  issued_at: z.string().optional().nullable(),
  revoked_at: z.string().optional().nullable(),
  status: z.enum(["active", "suspended", "lost", "revoked"]).default("active"),
  notes: z.string().optional().nullable(),
});

export const updateRFIDCardSchema = createRFIDCardSchema.partial();

export const rfidCardResponseSchema = z.object({
  id: z.uuid(),
  employee_id: z.uuid().nullable(),
  card_uid: z.string(),
  issued_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  status: z.enum(["active", "suspended", "lost", "revoked"]),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateRFIDCardDto = z.infer<typeof createRFIDCardSchema>;
export type UpdateRFIDCardDto = z.infer<typeof updateRFIDCardSchema>;
export type RFIDCardResponseDto = z.infer<typeof rfidCardResponseSchema>;

// ====== MAPPER ======
export const toRFIDCardResponseDto = (
  entity: RFIDCard
): RFIDCardResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id ?? null,
  card_uid: entity.card_uid,
  issued_at: entity.issued_at ?? null,
  revoked_at: entity.revoked_at ?? null,
  status: entity.status,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
