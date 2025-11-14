import { z } from "zod";

// ====== ZOD SCHEMAS ======
export const analysisResponseSchema = z.object({
  totalEmployees: z.number(),
  activeEmployees: z.number(),
  onLeaveEmployees: z.number(),
  inactiveEmployees: z.number(),
});

// ====== TYPES ======
export type AnalysisResponseDto = z.infer<typeof analysisResponseSchema>;

// ====== MAPPER ======
export const toAnalysisResponseDto = (data: {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
}): AnalysisResponseDto => ({
  totalEmployees: data.totalEmployees,
  activeEmployees: data.activeEmployees,
  onLeaveEmployees: data.onLeaveEmployees,
  inactiveEmployees: data.inactiveEmployees,
});