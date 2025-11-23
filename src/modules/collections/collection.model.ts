export interface DirectusCollection {
  collection: string;
  icon: string;
  note: string | null;
  display_template: string | null;
  hidden: boolean;
  singleton: boolean;
  translations: Record<string, string> | null;
  archive_field: string | null;
  archive_app_filter: boolean;
  archive_value: string | null;
  unarchive_value: string | null;
  sort_field: string | null;
  accountability: string | null;
  color: string | null;
  item_duplication_fields: string[] | null;
  sort: number | null;
  group: string | null;
  collapse: string;
  preview_url: string | null;
  versioning: boolean;
}

export const COLLECTIONS_ENDPOINT = "/collections";
