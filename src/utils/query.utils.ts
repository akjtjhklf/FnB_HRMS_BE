import { Request } from "express";
import { PaginationQueryDto } from "../core/dto/pagination.dto";

/**
 * Parse pagination query từ Express request
 */
export function parsePaginationQuery(req: Request): PaginationQueryDto {
  const query: PaginationQueryDto = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  };

  // Parse sort
  if (req.query.sort) {
    query.sort = req.query.sort as string | string[];
  }

  // Parse search
  if (req.query.search) {
    query.search = req.query.search as string;
  }

  // Parse filter (expect JSON string or object)
  if (req.query.filter) {
    try {
      query.filter = typeof req.query.filter === 'string' 
        ? JSON.parse(req.query.filter)
        : req.query.filter;
    } catch (error) {
      console.warn('Failed to parse filter:', error);
    }
  }

  // Parse fields
  if (req.query.fields) {
    const fieldsStr = req.query.fields as string;
    query.fields = fieldsStr.split(',').map(f => f.trim());
  }

  return query;
}
