import axios from "axios";
import { adminDirectus as directus } from "../../utils/directusClient";
import { DirectusCollection, COLLECTIONS_ENDPOINT } from "./collection.model";
import { HttpError } from "../../core/base";

export class CollectionRepository {
  private async getHeaders() {
    const token = await directus.getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  private getBaseUrl() {
    return process.env.DIRECTUS_URL || "http://localhost:8055";
  }

  async findAll(): Promise<DirectusCollection[]> {
    try {
      const headers = await this.getHeaders();
      const baseUrl = this.getBaseUrl();

      const response = await axios.get(`${baseUrl}${COLLECTIONS_ENDPOINT}`, {
        headers,
      });

      return (response.data?.data || []) as DirectusCollection[];
    } catch (error: any) {
      console.error("❌ Axios findAll error (collections):", error?.response?.data || error.message);
      throw new HttpError(
        500,
        "Không thể lấy danh sách collections từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }
}
