import { Request, Response } from 'express';
import { ApiResponse } from '../../core/response';
import { sendError } from '../../core/response';
import * as analyticsService from './analytics.service';
import {
  toOverviewStatsDto,
  toEmployeeAnalyticsDto,
  toAttendanceAnalyticsDto,
  toScheduleAnalyticsDto,
  toSalaryAnalyticsDto,
} from './analytics.dto';

/**
 * GET /api/analytics/overview
 * Get overview dashboard statistics
 */
export const getOverview = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const { date } = req.query;
    
    const stats = await analyticsService.getOverviewStats(date as string);
    const response = toOverviewStatsDto(stats);
    
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Error in getOverview:', error);
    return sendError(res, error?.message || 'Failed to get overview stats', 500);
  }
};

/**
 * GET /api/analytics/employees
 * Get employee analytics with filters
 */
export const getEmployees = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
      status: req.query.status as string,
    };
    
    const analytics = await analyticsService.getEmployeeAnalytics(filters);
    const response = toEmployeeAnalyticsDto(analytics);
    
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Error in getEmployees:', error);
    return sendError(res, error?.message || 'Failed to get employee analytics', 500);
  }
};

/**
 * GET /api/analytics/attendance
 * Get attendance analytics
 */
export const getAttendance = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
      employeeId: req.query.employeeId as string,
    };
    
    const analytics = await analyticsService.getAttendanceAnalytics(filters);
    const response = toAttendanceAnalyticsDto(analytics);
    
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Error in getAttendance:', error);
    return sendError(res, error?.message || 'Failed to get attendance analytics', 500);
  }
};

/**
 * GET /api/analytics/schedule
 * Get schedule analytics
 */
export const getSchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
    };
    
    const analytics = await analyticsService.getScheduleAnalytics(filters);
    const response = toScheduleAnalyticsDto(analytics);
    
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Error in getSchedule:', error);
    return sendError(res, error?.message || 'Failed to get schedule analytics', 500);
  }
};

/**
 * GET /api/analytics/salary
 * Get salary analytics
 */
export const getSalary = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
      month: req.query.month as string,
    };
    
    const analytics = await analyticsService.getSalaryAnalytics(filters);
    const response = toSalaryAnalyticsDto(analytics);
    
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Error in getSalary:', error);
    return sendError(res, error?.message || 'Failed to get salary analytics', 500);
  }
};

/**
 * GET /api/analytics/trends
 * Get trend data over time
 */
export const getTrends = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      granularity: req.query.granularity as any,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
    };
    
    const trends = await analyticsService.getTrendData(filters);
    
    return res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('❌ Error in getTrends:', error);
    return sendError(res, error?.message || 'Failed to get trend data', 500);
  }
};

/**
 * GET /api/analytics/comparison
 * Get period-over-period comparison
 */
export const getComparison = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = req.query;
    
    const comparison = await analyticsService.getComparativeAnalytics(
      currentStartDate as string,
      currentEndDate as string,
      previousStartDate as string,
      previousEndDate as string
    );
    
    return res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('❌ Error in getComparison:', error);
    return sendError(res, error?.message || 'Failed to get comparison data', 500);
  }
};

/**
 * GET /api/analytics/performance-ranking
 * Get employee performance ranking
 */
export const getPerformanceRanking = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
    };
    
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string || 'attendance_rate';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    
    const ranking = await analyticsService.getEmployeePerformanceRanking(
      filters,
      limit,
      sortBy,
      order
    );
    
    return res.json({
      success: true,
      data: ranking,
    });
  } catch (error: any) {
    console.error('❌ Error in getPerformanceRanking:', error);
    return sendError(res, error?.message || 'Failed to get performance ranking', 500);
  }
};

/**
 * GET /api/analytics/export
 * Export analytics data to CSV/Excel
 */
export const exportAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const { format, dataType } = req.query;
    
    // TODO: Implement actual export logic
    // For now, return placeholder
    return res.json({
      success: true,
      data: {
        message: 'Export feature coming soon',
        format,
        dataType,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in exportAnalytics:', error);
    return sendError(res, error?.message || 'Failed to export analytics', 500);
  }
};
