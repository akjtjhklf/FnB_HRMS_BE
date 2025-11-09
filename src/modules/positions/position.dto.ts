import { z } from "zod";
import { Position } from "./position.model";

// ====== ZOD SCHEMAS ======
export const createPositionSchema = z.object({
  name: z.string().min(1, "Tên vị trí không được để trống"),
  description: z.string().optional().nullable(),
});

export const updatePositionSchema = createPositionSchema.partial();

export const positionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreatePositionDto = z.infer<typeof createPositionSchema>;
export type UpdatePositionDto = z.infer<typeof updatePositionSchema>;
export type PositionResponseDto = z.infer<typeof positionResponseSchema>;

// ====== MAPPER ======
export const toPositionResponseDto = (
  entity: Position
): PositionResponseDto => ({
  id: entity.id,
  name: entity.name,
  description: entity.description ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
