/**
 * Base pagination request DTO
 */
export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  sort?: string | string[]; // e.g., "name" or "-created_at" or ["name", "-date"]
  filter?: Record<string, any>;
  search?: string; // Global search
  fields?: string[];
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Parse sort string to Directus format
 * @example "-created_at" => ["-created_at"]
 * @example "name" => ["name"]
 */
export function parseSortParam(sort?: string | string[]): string[] | undefined {
  if (!sort) return undefined;
  if (Array.isArray(sort)) return sort;
  return sort.split(',').map(s => s.trim());
}

/**
 * Build Directus filter from search string
 * @param search Search term
 * @param searchFields Fields to search in
 */
export function buildSearchFilter(
  search: string | undefined,
  searchFields: string[]
): Record<string, any> | undefined {
  if (!search || searchFields.length === 0) return undefined;
  
  return {
    _or: searchFields.map(field => ({
      [field]: { _contains: search }
    }))
  };
}

/**
 * Merge filters (search + custom filters)
 */
export function mergeFilters(
  filter?: Record<string, any>,
  searchFilter?: Record<string, any>
): Record<string, any> | undefined {
  if (!filter && !searchFilter) return undefined;
  if (!filter) return searchFilter;
  if (!searchFilter) return filter;
  
  return {
    _and: [filter, searchFilter]
  };
}