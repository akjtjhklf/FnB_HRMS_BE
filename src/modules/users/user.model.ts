export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  password?: string | null;
  location?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  avatar?: string | null;
  language?: string | null;
  tfa_secret?: string | null;
  status: "active" | "invited" | "suspended";
  role?: string | null; // references directus_roles.id
  token?: string | null;
  last_access?: string | null;
  last_page?: string | null;
  provider?: string | null;
  external_identifier?: string | null;
  auth_data?: Record<string, unknown> | null;
  email_notifications?: boolean;
  appearance?: string | null;
  theme_dark?: string | null;
  theme_light?: string | null;
  theme_dark_overrides?: Record<string, unknown> | null;
  theme_light_overrides?: Record<string, unknown> | null;
  text_direction?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const USERS_COLLECTION = "directus_users";
