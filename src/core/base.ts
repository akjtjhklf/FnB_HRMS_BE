// src/core/base.ts
import { parsePaginationParams } from './dto/pagination.dto';
export type Identifier = number | string;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ====== Base Repository Pattern ======
export abstract class BaseRepository<T extends { id?: Identifier }> {
  protected collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  abstract findAll(query?: Record<string, unknown>): Promise<T[]>;
  abstract findById(id: Identifier): Promise<T | null>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: Identifier, data: Partial<T>): Promise<T>;
  abstract delete(id: Identifier): Promise<void>;
}

// ====== Base Service Pattern ======
export abstract class BaseService<T extends { id?: Identifier }> {
  protected repo: BaseRepository<T>;

  constructor(repo: BaseRepository<T>) {
    this.repo = repo;
  }

  async list(query?: Record<string, unknown>): Promise<T[]> {
    try {
      return await this.repo.findAll(query);
    } catch (error) {
      this.handleError(error, "LIST_FAILED");
    }
  }

  async get(id: Identifier): Promise<T> {
    try {
      const data = await this.repo.findById(id);
      if (!data)
        throw new HttpError(404, "Không tìm thấy bản ghi", "NOT_FOUND");
      return data;
    } catch (error) {
      this.handleError(error, "GET_FAILED");
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      return await this.repo.create(data);
    } catch (error) {
      this.handleError(error, "CREATE_FAILED");
    }
  }

  async update(id: Identifier, data: Partial<T>): Promise<T> {
    try {
      return await this.repo.update(id, data);
    } catch (error) {
      this.handleError(error, "UPDATE_FAILED");
    }
  }

  async remove(id: Identifier): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (error) {
      this.handleError(error, "DELETE_FAILED");
    }
  }

  // Optional pagination (Directus supports limit + offset)
  async paginate(query?: Record<string, unknown>): Promise<PaginatedResult<T>> {
    try {
      // Normalize pagination params (page/limit/offset/sort/filters)
      const { page, limit, offset, sort, filters } =
        parsePaginationParams(query as Record<string, any>);

      const items = await this.repo.findAll({
        limit,
        offset,
        sort,
        filter: filters,
      });

      return {
        items,
        total: items.length, // may replace with total count if repo returns it
      };
    } catch (error) {
      this.handleError(error, 'PAGINATE_FAILED');
    }
  }

  protected handleError(error: unknown, code: string): never {
    if (error instanceof HttpError) throw error;
    console.error(`[${code}]`, error);
    throw new HttpError(500, "Internal Server Error", code, error);
  }
}
