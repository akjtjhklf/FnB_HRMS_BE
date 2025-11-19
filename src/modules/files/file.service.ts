import { BaseService, HttpError } from "../../core/base";
import { FileEntity } from "./file.model";
import FileRepository from "./file.repository";
import cloudinary from "../../config/cloudinary.config";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";

export class FileService extends BaseService<FileEntity> {
  constructor(repo = new FileRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<FileEntity>> {
    return await (this.repo as FileRepository).findAllPaginated(query);
  }

  async get(id: string) {
    const file = await this.repo.findById(id);
    if (!file)
      throw new HttpError(404, "Không tìm thấy file", "FILE_NOT_FOUND");
    return file;
  }

  /**
   * Upload file lên Cloudinary và lưu metadata vào Directus
   */
  async upload(file: Express.Multer.File, uploaded_by?: string) {
    if (!file) throw new HttpError(400, "Thiếu file upload", "NO_FILE");

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "hrms_uploads",
    });

    const entity: Partial<FileEntity> = {
      id: crypto.randomUUID(),
      storage: "cloudinary",
      filename_download: result.original_filename,
      title: result.original_filename,
      type: result.resource_type,
      filesize: file.size,
      width: result.width,
      height: result.height,
      location: result.secure_url,
      uploaded_by,
      metadata: {
        public_id: result.public_id,
        format: result.format,
        url: result.secure_url,
      },
      uploaded_on: new Date().toISOString(),
    };

    return await this.repo.create(entity);
  }

  async remove(id: string) {
    const file = await this.repo.findById(id);
    if (!file)
      throw new HttpError(404, "Không tìm thấy file", "FILE_NOT_FOUND");

    // Xoá luôn Cloudinary file (nếu có public_id)
    const public_id = file.metadata?.public_id;
    if (public_id) {
      await (cloudinary.uploader as any)
        .destroy(public_id, { invalidate: true })
        .catch(() => {});
    }

    await this.repo.delete(id);
  }
}

export default FileService;
