export interface FileEntity {
  id: string;
  storage: string; // ví dụ: 'cloudinary'
  filename_disk?: string | null;
  filename_download: string;
  title?: string | null;
  type?: string | null;
  folder?: string | null;
  uploaded_by?: string | null;
  created_on?: string | null;
  modified_by?: string | null;
  modified_on?: string | null;
  charset?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  embed?: string | null;
  description?: string | null;
  location?: string | null;
  tags?: string | null;
  metadata?: Record<string, unknown> | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  tus_id?: string | null;
  tus_data?: Record<string, unknown> | null;
  uploaded_on?: string | null;
}

export const FILES_COLLECTION = "directus_files";
