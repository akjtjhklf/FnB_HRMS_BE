import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { ScheduleChangeRequest } from "./schedule-change-request.model";
import ScheduleChangeRequestRepository from "./schedule-change-request.repository";
import ScheduleAssignmentRepository from "../schedule-assignments/schedule-assignment.repository";

export class ScheduleChangeRequestService extends BaseService<ScheduleChangeRequest> {
  private assignmentRepo: ScheduleAssignmentRepository;

  constructor(
    repo = new ScheduleChangeRequestRepository(),
    assignmentRepo = new ScheduleAssignmentRepository()
  ) {
    super(repo);
    this.assignmentRepo = assignmentRepo;
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<ScheduleChangeRequest>> {
    return await (
      this.repo as ScheduleChangeRequestRepository
    ).findAllPaginated(query);
  }

  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");
    return record;
  }

  async create(data: Partial<ScheduleChangeRequest>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<ScheduleChangeRequest>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    await this.repo.delete(id);
  }

  /**
   * ============================================
   * ✅ DUYỆT VÀ TỰ ĐỘNG HOÁN ĐỔI CA
   * ============================================
   * Khi duyệt yêu cầu đổi ca:
   * 1. Kiểm tra yêu cầu có tồn tại và status = "pending"
   * 2. Nếu type = "shift_swap", tự động hoán đổi assignments
   * 3. Cập nhật status thành "approved"
   */
  async approveAndSwap(requestId: string, approvedBy: string) {
    const request = await this.repo.findById(requestId);
    if (!request)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    if (request.status !== "pending") {
      throw new HttpError(
        400,
        "Yêu cầu đã được xử lý trước đó",
        "REQUEST_ALREADY_PROCESSED"
      );
    }

    // ✅ FIX: Check new fields instead of non-existent properties
    let swapResult = null;
    if (request.type === "shift_swap") {
      if (!request.from_assignment_id || !request.to_assignment_id) {
        throw new HttpError(
          400,
          "Thiếu thông tin assignment để hoán đổi",
          "MISSING_ASSIGNMENT_IDS"
        );
      }
      
      swapResult = await this.swapAssignments(
        request.from_assignment_id,
        request.to_assignment_id
      );
    }

    // Cập nhật trạng thái yêu cầu
    const updatedRequest = await this.repo.update(requestId, {
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });

    return {
      request: updatedRequest,
      swap_result: swapResult,
    };
  }

  /**
   * ============================================
   * 🔄 HOÁN ĐỔI 2 ASSIGNMENTS
   * ============================================
   * Tự động swap employee_id của 2 assignments
   */
  private async swapAssignments(assignmentId1: string, assignmentId2: string) {
    const [assignment1, assignment2] = await Promise.all([
      this.assignmentRepo.findById(assignmentId1),
      this.assignmentRepo.findById(assignmentId2),
    ]);

    if (!assignment1 || !assignment2) {
      throw new HttpError(
        404,
        "Không tìm thấy phân công ca",
        "ASSIGNMENT_NOT_FOUND"
      );
    }

    // Hoán đổi employee_id
    const temp = assignment1.employee_id;
    await Promise.all([
      this.assignmentRepo.update(assignmentId1, {
        employee_id: assignment2.employee_id,
      }),
      this.assignmentRepo.update(assignmentId2, {
        employee_id: temp,
      }),
    ]);

    return {
      assignment1_id: assignmentId1,
      assignment2_id: assignmentId2,
      swapped: true,
    };
  }

  /**
   * ============================================
   * ❌ TỪ CHỐI YÊU CẦU
   * ============================================
   */
  async reject(requestId: string, rejectedBy: string, reason?: string) {
    const request = await this.repo.findById(requestId);
    if (!request)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    if (request.status !== "pending") {
      throw new HttpError(
        400,
        "Yêu cầu đã được xử lý trước đó",
        "REQUEST_ALREADY_PROCESSED"
      );
    }

    return await this.repo.update(requestId, {
      status: "rejected",
      approved_by: rejectedBy,
      approved_at: new Date().toISOString(),
      reason: reason || request.reason,
    });
  }
}

export default ScheduleChangeRequestService;
