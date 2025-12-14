import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { ScheduleChangeRequest } from "./schedule-change-request.model";
import ScheduleChangeRequestRepository from "./schedule-change-request.repository";
import ScheduleAssignmentRepository from "../schedule-assignments/schedule-assignment.repository";
import { getNotificationHelper, NotificationType } from "../notifications";
import EmployeeRepository from "../employees/employee.repository";
import { now, DATE_FORMATS } from "../../utils/date.utils";

export class ScheduleChangeRequestService extends BaseService<ScheduleChangeRequest> {
  private assignmentRepo: ScheduleAssignmentRepository;
  private employeeRepo: EmployeeRepository;

  constructor(
    repo = new ScheduleChangeRequestRepository(),
    assignmentRepo = new ScheduleAssignmentRepository()
  ) {
    super(repo);
    this.assignmentRepo = assignmentRepo;
    this.employeeRepo = new EmployeeRepository();
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
    const created = await this.repo.create(data);

    // Send notification to managers about new request
    try {
      const employeeId = data.requester_id as string;
      if (employeeId) {
        const employee = await this.employeeRepo.findById(employeeId);
        const notificationHelper = getNotificationHelper();

        await notificationHelper.notifyManagers({
          type: NotificationType.LEAVE_REQUEST,
          title: "Yêu cầu thay đổi lịch làm việc",
          message: `${employee?.full_name || 'Nhân viên'} đã gửi yêu cầu ${data.type === 'shift_swap' ? 'đổi ca' : 'nghỉ phép'}`,
          actionUrl: `/schedule-requests/${created.id}`,
          data: { requestId: created.id, employeeId },
          departmentId: (employee as any)?.department_id,
        });
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send schedule request notification:', notifyErr);
    }

    return created;
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
      approved_at: now().format(DATE_FORMATS.DATETIME),
    });

    // Send notification to employee
    await this.notifyRequestResult(updatedRequest, true);

    return {
      request: updatedRequest,
      swap_result: swapResult,
    };
  }

  /**
   * Send notification to employee about request result
   */
  private async notifyRequestResult(request: ScheduleChangeRequest, approved: boolean) {
    try {
      const employeeId = typeof request.requester_id === 'object'
        ? (request.requester_id as any).id
        : request.requester_id;

      if (employeeId) {
        const notificationHelper = getNotificationHelper();
        await notificationHelper.notifyEmployee(employeeId, {
          type: approved ? NotificationType.LEAVE_APPROVED : NotificationType.LEAVE_REJECTED,
          title: approved ? "Yêu cầu được duyệt" : "Yêu cầu bị từ chối",
          message: approved
            ? "Yêu cầu thay đổi lịch làm việc của bạn đã được duyệt"
            : "Yêu cầu thay đổi lịch làm việc của bạn đã bị từ chối",
          actionUrl: `/schedule-requests/${request.id}`,
          data: { requestId: request.id, approved },
        });
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send request result notification:', notifyErr);
    }
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

    const updatedRequest = await this.repo.update(requestId, {
      status: "rejected",
      approved_by: rejectedBy,
      approved_at: now().format(DATE_FORMATS.DATETIME),
      reason: reason || request.reason,
    });

    // Send notification to employee
    await this.notifyRequestResult(updatedRequest, false);

    return updatedRequest;
  }
}

export default ScheduleChangeRequestService;
