import NovuService from "./novu.service";
import NotificationLogRepository from "./notification-log.repository";
import { DirectusRepository } from "../../core/directus.repository";
import { directus } from "../../utils/directusClient";
import { readItems } from "@directus/sdk";

/**
 * Notification Types - Add more as needed
 */
export enum NotificationType {
  // System
  SYSTEM = "SYSTEM",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  
  // Payroll
  PAYSLIP_READY = "PAYSLIP_READY",
  PAYSLIP_UPDATED = "PAYSLIP_UPDATED",
  
  // Salary Request
  SALARY_INCREASE_REQUEST = "SALARY_INCREASE_REQUEST",
  SALARY_INCREASE_APPROVED = "SALARY_INCREASE_APPROVED",
  SALARY_INCREASE_REJECTED = "SALARY_INCREASE_REJECTED",
  
  // Leave/Attendance
  LEAVE_REQUEST = "LEAVE_REQUEST",
  LEAVE_APPROVED = "LEAVE_APPROVED",
  LEAVE_REJECTED = "LEAVE_REJECTED",
  ATTENDANCE_REMINDER = "ATTENDANCE_REMINDER",
  
  // Schedule
  SCHEDULE_UPDATED = "SCHEDULE_UPDATED",
  SHIFT_ASSIGNED = "SHIFT_ASSIGNED",
  
  // Contract
  CONTRACT_EXPIRING = "CONTRACT_EXPIRING",
  CONTRACT_RENEWED = "CONTRACT_RENEWED",
}

/**
 * Recipient Strategy
 */
export enum RecipientStrategy {
  /** Send to specific employee(s) */
  SPECIFIC = "SPECIFIC",
  /** Send to all employees */
  ALL = "ALL",
  /** Send to managers only */
  MANAGERS = "MANAGERS",
  /** Send to HR department */
  HR = "HR",
  /** Send to department members */
  DEPARTMENT = "DEPARTMENT",
  /** Send to role-based users */
  ROLE = "ROLE",
}

interface NotifyOptions {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
  triggeredBy?: string;
}

interface NotifySpecificOptions extends NotifyOptions {
  employeeIds: string[];
}

interface NotifyManagersOptions extends NotifyOptions {
  /** Optional: only managers of specific department */
  departmentId?: string;
}

interface NotifyDepartmentOptions extends NotifyOptions {
  departmentId: string;
  /** Include department manager */
  includeManager?: boolean;
}

interface NotifyRoleOptions extends NotifyOptions {
  roleId: string;
}

/**
 * Notification Helper Service
 * High-level API for sending notifications across the system
 */
export class NotificationHelperService {
  private novuService: NovuService;
  private defaultWorkflowId: string;

  constructor(novuService: NovuService) {
    this.novuService = novuService;
    this.defaultWorkflowId = process.env.NOVU_DEFAULT_WORKFLOW || "in-app-notification";
  }

  /**
   * Build payload with type metadata
   */
  private buildPayload(options: NotifyOptions): Record<string, any> {
    return {
      title: options.title,
      message: options.message,
      type: options.type,
      actionUrl: options.actionUrl || "",
      data: options.data || {},
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== SPECIFIC RECIPIENTS ====================

  /**
   * Send to specific employee(s)
   */
  async notifyEmployees(options: NotifySpecificOptions): Promise<void> {
    const payload = this.buildPayload(options);

    if (options.employeeIds.length === 1) {
      await this.novuService.sendToUser({
        subscriberId: options.employeeIds[0],
        workflowId: this.defaultWorkflowId,
        payload,
        triggeredBy: options.triggeredBy,
      });
    } else {
      await this.novuService.sendToMultipleUsers({
        subscriberIds: options.employeeIds,
        workflowId: this.defaultWorkflowId,
        payload,
        triggeredBy: options.triggeredBy,
      });
    }
  }

  /**
   * Send to a single employee
   */
  async notifyEmployee(employeeId: string, options: NotifyOptions): Promise<void> {
    await this.notifyEmployees({
      ...options,
      employeeIds: [employeeId],
    });
  }

  // ==================== ALL EMPLOYEES ====================

  /**
   * Send to all employees (via topic)
   */
  async notifyAll(options: NotifyOptions): Promise<void> {
    const payload = this.buildPayload(options);

    await this.novuService.sendToTopic({
      topicKey: "all-employees",
      workflowId: this.defaultWorkflowId,
      payload,
      triggeredBy: options.triggeredBy,
    });
  }

  // ==================== MANAGERS ====================

  /**
   * Send to all managers
   */
  async notifyManagers(options: NotifyManagersOptions): Promise<void> {
    const managerIds = await this.getManagerIds(options.departmentId);

    if (managerIds.length === 0) {
      console.warn("⚠️ No managers found to notify");
      return;
    }

    await this.notifyEmployees({
      ...options,
      employeeIds: managerIds,
    });
  }

  /**
   * Get manager IDs from database
   */
  private async getManagerIds(departmentId?: string): Promise<string[]> {
    try {
      const filter: any = {
        is_manager: { _eq: true },
        status: { _eq: "active" },
      };

      if (departmentId) {
        filter.department_id = { _eq: departmentId };
      }

      const managers = await directus.request(
        readItems("employees", {
          filter,
          fields: ["id"],
          limit: -1,
        })
      );

      return (managers as any[]).map((m) => m.id);
    } catch (error) {
      console.error("❌ Failed to get managers:", error);
      return [];
    }
  }

  // ==================== DEPARTMENT ====================

  /**
   * Send to all members of a department
   */
  async notifyDepartment(options: NotifyDepartmentOptions): Promise<void> {
    const employeeIds = await this.getDepartmentEmployeeIds(
      options.departmentId,
      options.includeManager ?? true
    );

    if (employeeIds.length === 0) {
      console.warn("⚠️ No employees found in department");
      return;
    }

    await this.notifyEmployees({
      ...options,
      employeeIds,
    });
  }

  /**
   * Get employee IDs in a department
   */
  private async getDepartmentEmployeeIds(
    departmentId: string,
    includeManager: boolean
  ): Promise<string[]> {
    try {
      const filter: any = {
        department_id: { _eq: departmentId },
        status: { _eq: "active" },
      };

      if (!includeManager) {
        filter.is_manager = { _eq: false };
      }

      const employees = await directus.request(
        readItems("employees", {
          filter,
          fields: ["id"],
          limit: -1,
        })
      );

      return (employees as any[]).map((e) => e.id);
    } catch (error) {
      console.error("❌ Failed to get department employees:", error);
      return [];
    }
  }

  // ==================== HR DEPARTMENT ====================

  /**
   * Send to HR department members
   */
  async notifyHR(options: NotifyOptions): Promise<void> {
    const hrEmployeeIds = await this.getHREmployeeIds();

    if (hrEmployeeIds.length === 0) {
      console.warn("⚠️ No HR employees found");
      return;
    }

    await this.notifyEmployees({
      ...options,
      employeeIds: hrEmployeeIds,
    });
  }

  /**
   * Get HR employee IDs
   */
  private async getHREmployeeIds(): Promise<string[]> {
    try {
      // Find HR department
      const departments = await directus.request(
        readItems("departments", {
          filter: {
            _or: [
              { name: { _icontains: "HR" } },
              { name: { _icontains: "Human Resource" } },
              { code: { _eq: "HR" } },
            ],
          },
          fields: ["id"],
          limit: 1,
        })
      );

      if ((departments as any[]).length === 0) {
        return [];
      }

      const hrDeptId = (departments as any[])[0].id;

      const employees = await directus.request(
        readItems("employees", {
          filter: {
            department_id: { _eq: hrDeptId },
            status: { _eq: "active" },
          },
          fields: ["id"],
          limit: -1,
        })
      );

      return (employees as any[]).map((e) => e.id);
    } catch (error) {
      console.error("❌ Failed to get HR employees:", error);
      return [];
    }
  }

  // ==================== ROLE-BASED ====================

  /**
   * Send to users with specific role
   */
  async notifyByRole(options: NotifyRoleOptions): Promise<void> {
    const employeeIds = await this.getEmployeeIdsByRole(options.roleId);

    if (employeeIds.length === 0) {
      console.warn("⚠️ No employees found with role");
      return;
    }

    await this.notifyEmployees({
      ...options,
      employeeIds,
    });
  }

  /**
   * Get employee IDs by role
   */
  private async getEmployeeIdsByRole(roleId: string): Promise<string[]> {
    try {
      // Get users with this role
      const users = await directus.request(
        readItems("directus_users", {
          filter: {
            role: { _eq: roleId },
          },
          fields: ["id"],
          limit: -1,
        })
      );

      const userIds = (users as any[]).map((u) => u.id);

      if (userIds.length === 0) return [];

      // Get employees linked to these users
      const employees = await directus.request(
        readItems("employees", {
          filter: {
            user_id: { _in: userIds },
            status: { _eq: "active" },
          },
          fields: ["id"],
          limit: -1,
        })
      );

      return (employees as any[]).map((e) => e.id);
    } catch (error) {
      console.error("❌ Failed to get employees by role:", error);
      return [];
    }
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Notify when payslip is ready
   */
  async notifyPayslipReady(employeeId: string, payslipData: {
    month: number;
    year: number;
    payslipId: string;
  }): Promise<void> {
    await this.notifyEmployee(employeeId, {
      type: NotificationType.PAYSLIP_READY,
      title: `Phiếu lương tháng ${payslipData.month}/${payslipData.year}`,
      message: "Phiếu lương của bạn đã sẵn sàng để xem",
      actionUrl: `/payslips/${payslipData.payslipId}`,
      data: payslipData,
    });
  }

  /**
   * Notify managers about salary increase request
   */
  async notifySalaryIncreaseRequest(
    employeeId: string,
    employeeName: string,
    requestId: string,
    departmentId?: string
  ): Promise<void> {
    await this.notifyManagers({
      type: NotificationType.SALARY_INCREASE_REQUEST,
      title: "Yêu cầu tăng lương mới",
      message: `${employeeName} đã gửi yêu cầu tăng lương`,
      actionUrl: `/salary-requests/${requestId}`,
      data: { employeeId, requestId },
      departmentId, // Only notify managers of employee's department
    });
  }

  /**
   * Notify employee about salary request result
   */
  async notifySalaryRequestResult(
    employeeId: string,
    approved: boolean,
    requestId: string
  ): Promise<void> {
    await this.notifyEmployee(employeeId, {
      type: approved
        ? NotificationType.SALARY_INCREASE_APPROVED
        : NotificationType.SALARY_INCREASE_REJECTED,
      title: approved ? "Yêu cầu tăng lương được duyệt" : "Yêu cầu tăng lương bị từ chối",
      message: approved
        ? "Yêu cầu tăng lương của bạn đã được phê duyệt"
        : "Yêu cầu tăng lương của bạn đã bị từ chối",
      actionUrl: `/salary-requests/${requestId}`,
      data: { requestId, approved },
    });
  }

  /**
   * Notify about leave request
   */
  async notifyLeaveRequest(
    managerId: string,
    employeeName: string,
    leaveRequestId: string
  ): Promise<void> {
    await this.notifyEmployee(managerId, {
      type: NotificationType.LEAVE_REQUEST,
      title: "Yêu cầu nghỉ phép mới",
      message: `${employeeName} đã gửi yêu cầu nghỉ phép`,
      actionUrl: `/leave-requests/${leaveRequestId}`,
      data: { leaveRequestId },
    });
  }

  /**
   * Notify employee about leave request result
   */
  async notifyLeaveRequestResult(
    employeeId: string,
    approved: boolean,
    leaveRequestId: string
  ): Promise<void> {
    await this.notifyEmployee(employeeId, {
      type: approved ? NotificationType.LEAVE_APPROVED : NotificationType.LEAVE_REJECTED,
      title: approved ? "Đơn nghỉ phép được duyệt" : "Đơn nghỉ phép bị từ chối",
      message: approved
        ? "Đơn xin nghỉ phép của bạn đã được phê duyệt"
        : "Đơn xin nghỉ phép của bạn đã bị từ chối",
      actionUrl: `/leave-requests/${leaveRequestId}`,
      data: { leaveRequestId, approved },
    });
  }

  /**
   * Notify about schedule update
   */
  async notifyScheduleUpdate(
    employeeId: string,
    weekStart: string
  ): Promise<void> {
    await this.notifyEmployee(employeeId, {
      type: NotificationType.SCHEDULE_UPDATED,
      title: "Lịch làm việc đã được cập nhật",
      message: `Lịch làm việc tuần ${weekStart} của bạn đã được cập nhật`,
      actionUrl: `/my-schedule?week=${weekStart}`,
      data: { weekStart },
    });
  }

  /**
   * Notify about contract expiring soon
   */
  async notifyContractExpiring(
    employeeId: string,
    daysUntilExpiry: number,
    contractId: string
  ): Promise<void> {
    await this.notifyEmployee(employeeId, {
      type: NotificationType.CONTRACT_EXPIRING,
      title: "Hợp đồng sắp hết hạn",
      message: `Hợp đồng của bạn sẽ hết hạn trong ${daysUntilExpiry} ngày`,
      actionUrl: `/contracts/${contractId}`,
      data: { contractId, daysUntilExpiry },
    });

    // Also notify HR
    await this.notifyHR({
      type: NotificationType.CONTRACT_EXPIRING,
      title: "Hợp đồng nhân viên sắp hết hạn",
      message: `Có hợp đồng sẽ hết hạn trong ${daysUntilExpiry} ngày`,
      actionUrl: `/contracts/${contractId}`,
      data: { contractId, employeeId, daysUntilExpiry },
    });
  }
}

// Singleton instance
let notificationHelper: NotificationHelperService | null = null;

export function getNotificationHelper(): NotificationHelperService {
  if (!notificationHelper) {
    const novuService = new NovuService(
      {
        apiKey: process.env.NOVU_API_KEY || "",
        apiUrl: process.env.NOVU_API_URL,
      },
      new NotificationLogRepository()
    );
    notificationHelper = new NotificationHelperService(novuService);
  }
  return notificationHelper;
}

export default NotificationHelperService;
