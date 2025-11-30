import { Request } from "express";
import { PaginationQueryDto } from "../core/dto/pagination.dto";

/**
 * Parse filter object from query params
 * Converts Express query filter format to Directus filter format
 */
function parseFilterObject(filterParam: any): Record<string, any> {
  const filter: Record<string, any> = {};
  
  for (const key in filterParam) {
    const value = filterParam[key];
    
    // If value is an array (e.g., filter[status][]=draft&filter[status][]=published)
    if (Array.isArray(value)) {
      filter[key] = { _in: value };
    }
    // If value is "true" or "false" string, convert to 1/0 for Directus (tinyint boolean fields)
    else if (value === 'true') {
      filter[key] = { _eq: 1 };
    }
    else if (value === 'false') {
      filter[key] = { _eq: 0 };
    }
    // Check if value is numeric string
    else if (typeof value === 'string' && !isNaN(Number(value))) {
      // Convert to number for proper comparison
      filter[key] = { _eq: Number(value) };
    }
    // Otherwise, use _eq operator with string value
    else {
      filter[key] = { _eq: value };
    }
  }
  
  return filter;
}

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
      const filterParam = req.query.filter;
      
      // If it's a string, try to parse as JSON
      if (typeof filterParam === 'string') {
        query.filter = JSON.parse(filterParam);
      } 
      // If it's an object (from query params like filter[key]=value)
      else if (typeof filterParam === 'object') {
        query.filter = parseFilterObject(filterParam);
      }
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
