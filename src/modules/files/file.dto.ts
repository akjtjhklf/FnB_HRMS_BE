import { z } from "zod";
import { FileEntity } from "./file.model";

export const createFileSchema = z.object({
  filename_download: z.string(),
  storage: z.string().default("cloudinary"),
  title: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  filesize: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  uploaded_by: z.uuid().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  metadata: z.record(z.any(), z.any()).optional().nullable(),
});

export const updateFileSchema = createFileSchema.partial();

export const fileResponseSchema = createFileSchema.extend({
  id: z.uuid(),
  created_on: z.string().nullable(),
  uploaded_on: z.string().nullable(),
});

export type CreateFileDto = z.infer<typeof createFileSchema>;
export type UpdateFileDto = z.infer<typeof updateFileSchema>;
export type FileResponseDto = z.infer<typeof fileResponseSchema>;

export const toFileResponseDto = (entity: FileEntity): FileResponseDto => ({
  id: entity.id,
  storage: entity.storage,
  filename_download: entity.filename_download,
  title: entity.title ?? null,
  type: entity.type ?? null,
  filesize: entity.filesize ?? null,
  width: entity.width ?? null,
  height: entity.height ?? null,
  description: entity.description ?? null,
  uploaded_by: entity.uploaded_by ?? null,
  created_on: entity.created_on ?? null,
  uploaded_on: entity.uploaded_on ?? null,
  location: entity.location ?? null,
  tags: entity.tags ?? null,
  metadata: entity.metadata ?? null,
});
