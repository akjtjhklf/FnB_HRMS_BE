export interface Policy {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
  ip_access?: string | null;
  enforce_tfa: boolean;
  admin_access: boolean;
  app_access: boolean;
}

export const POLICIES_COLLECTION = "directus_policies";
