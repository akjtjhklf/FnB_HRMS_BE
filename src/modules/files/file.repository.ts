import { DirectusRepository } from "../../core/directus.repository";
import { FileEntity, FILES_COLLECTION } from "./file.model";

/**
 * Repository cho Directus Files
 */
export class FileRepository extends DirectusRepository<FileEntity> {
  constructor() {
    super(FILES_COLLECTION);
  }
}

export default FileRepository;
