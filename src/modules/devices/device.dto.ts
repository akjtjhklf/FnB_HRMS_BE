import { z } from "zod";
import { Device } from "./device.model";

// ====== CREATE / UPDATE VALIDATION ======
export const createDeviceSchema = z.object({
  name: z.string().min(1),
  location: z.string().nullable().optional(),
  device_key: z.string().min(1),
  ip_address: z.string().nullable().optional(),
  mac_address: z.string().nullable().optional(),
  firmware_version: z.string().nullable().optional(),
  last_seen_at: z.string().nullable().optional(),
  status: z.enum(["online", "offline", "decommissioned"]).default("online"),
  current_mode: z.enum(["attendance", "enroll"]).default("attendance"),
  employee_id_pending: z.uuid().nullable().optional(),
  metadata: z.record(z.any(), z.any()).nullable().optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

// ====== RESPONSE DTO ======
export const deviceResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  location: z.string().nullable(),
  device_key: z.string(),
  ip_address: z.string().nullable(),
  mac_address: z.string().nullable(),
  firmware_version: z.string().nullable(),
  last_seen_at: z.string().nullable(),
  status: z.enum(["online", "offline", "decommissioned"]),
  current_mode: z.enum(["attendance", "enroll"]),
  employee_id_pending: z.uuid().nullable(),
  metadata: z.record(z.any(), z.any()).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateDeviceDto = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceDto = z.infer<typeof updateDeviceSchema>;
export type DeviceResponseDto = z.infer<typeof deviceResponseSchema>;

// ====== MAPPER ======
export const toDeviceResponseDto = (entity: Device): DeviceResponseDto => ({
  id: entity.id,
  name: entity.name,
  location: entity.location ?? null,
  device_key: entity.device_key,
  ip_address: entity.ip_address ?? null,
  mac_address: entity.mac_address ?? null,
  firmware_version: entity.firmware_version ?? null,
  last_seen_at: entity.last_seen_at ?? null,
  status: entity.status,
  current_mode: entity.current_mode,
  employee_id_pending: entity.employee_id_pending ?? null,
  metadata: entity.metadata ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
