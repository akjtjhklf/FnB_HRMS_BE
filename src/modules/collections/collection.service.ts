import { CollectionRepository } from "./collection.repository";
import { DirectusCollection } from "./collection.model";

export class CollectionService {
  private repository: CollectionRepository;

  constructor() {
    this.repository = new CollectionRepository();
  }

  async list(): Promise<DirectusCollection[]> {
    return await this.repository.findAll();
  }
}
