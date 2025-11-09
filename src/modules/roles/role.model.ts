export interface Role {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  parent?: string | null; // references directus_roles.id
}

export const ROLES_COLLECTION = "directus_roles";
