/**
 * Base pagination request DTO
 */
export interface PaginationQueryDto {
  // `req.query` values are strings at runtime; accept either to allow typing
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
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

/**
 * Parse pagination-related params that usually come from `req.query`.
 * Returns normalized numeric `page`, `limit`, `offset`, parsed `sort` array
 * and the remaining filters (everything else in the query object).
 */
export function parsePaginationParams(query: Record<string, any> | undefined) {
  const q = query ?? {};
  const { page, limit, offset, sort, filter, search, fields, ...other } = q;

  const pageNum = Number(page ?? q.page ?? 1) || 1;
  const limitNum = Number(limit ?? q.limit ?? 10) || 10;
  const offsetNum = Number(offset ?? q.offset ?? (pageNum - 1) * limitNum) || 0;

  const sortArr = parseSortParam(sort as any);

  // merge filter param (if provided as object) with other query keys
  const filters: Record<string, any> = {};
  if (filter && typeof filter === 'object') Object.assign(filters, filter);
  if (search) filters._search = search;
  if (fields) filters._fields = fields;

  // remaining keys from query (excluding reserved ones) are considered custom filters
  Object.keys(other).forEach(k => {
    const v = other[k];
    if (v !== undefined) filters[k] = v;
  });

  return {
    page: pageNum,
    limit: limitNum,
    offset: offsetNum,
    sort: sortArr,
    filters: Object.keys(filters).length ? filters : undefined,
  };
}