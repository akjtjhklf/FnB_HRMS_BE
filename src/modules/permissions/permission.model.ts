export interface Permission {
  id: string;
  collection: string;
  action: string;
  permissions?: Record<string, unknown> | null;
  validation?: Record<string, unknown> | null;
  presets?: Record<string, unknown> | null;
  fields?: string | null;
  policy: string; // references directus_policies.id
}

export const PERMISSIONS_COLLECTION = "directus_permissions";
