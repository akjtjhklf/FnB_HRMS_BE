import { DirectusCollection } from "./collection.model";

export interface CollectionDto extends DirectusCollection {}

export interface CollectionResponseDto {
  data: CollectionDto[];
  message: string;
  success: true;
}
