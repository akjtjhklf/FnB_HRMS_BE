import { z } from "zod";

export const checkInSchema = z.object({
  assignment_id: z.string().uuid().optional(),
  location: z.any().optional(), // Can be refined if location structure is known
  rfid_card_id: z.string().optional(),
});

export const checkOutSchema = z.object({
  assignment_id: z.string().uuid().optional(),
});

export const manualAdjustSchema = z.object({
  clock_in: z.string().datetime().optional(),
  clock_out: z.string().datetime().optional(),
  notes: z.string().optional(),
});
