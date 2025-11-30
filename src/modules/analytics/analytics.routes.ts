import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validateQuery } from '../../middlewares/validate.middleware';
import * as analyticsController from './analytics.controller';
import {
  getOverviewQuerySchema,
  getEmployeeAnalyticsQuerySchema,
  getAttendanceAnalyticsQuerySchema,
  getScheduleAnalyticsQuerySchema,
  getSalaryAnalyticsQuerySchema,
  getTrendsQuerySchema,
  getComparisonQuerySchema,
  getPerformanceRankingQuerySchema,
  getExportQuerySchema,
} from './analytics.dto';

const router = Router();

/**
 * All analytics routes require authentication
 * Admin and Manager have full access
 * Employees can only view their own performance data
 */

// GET /api/analytics/overview - Dashboard overview
router.get(
  '/overview',
  requireAuth(['admin', 'manager']),
  validateQuery(getOverviewQuerySchema),
  analyticsController.getOverview
);

// GET /api/analytics/employees - Employee analytics
router.get(
  '/employees',
  requireAuth(['admin', 'manager']),
  validateQuery(getEmployeeAnalyticsQuerySchema),
  analyticsController.getEmployees
);

// GET /api/analytics/attendance - Attendance analytics
router.get(
  '/attendance',
  requireAuth(['admin', 'manager']),
  validateQuery(getAttendanceAnalyticsQuerySchema),
  analyticsController.getAttendance
);

// GET /api/analytics/schedule - Schedule analytics
router.get(
  '/schedule',
  requireAuth(['admin', 'manager']),
  validateQuery(getScheduleAnalyticsQuerySchema),
  analyticsController.getSchedule
);

// GET /api/analytics/salary - Salary analytics
router.get(
  '/salary',
  requireAuth(['admin', 'manager']),
  validateQuery(getSalaryAnalyticsQuerySchema),
  analyticsController.getSalary
);

// GET /api/analytics/trends - Trend data
router.get(
  '/trends',
  requireAuth(['admin', 'manager']),
  validateQuery(getTrendsQuerySchema),
  analyticsController.getTrends
);

// GET /api/analytics/comparison - Period comparison
router.get(
  '/comparison',
  requireAuth(['admin', 'manager']),
  validateQuery(getComparisonQuerySchema),
  analyticsController.getComparison
);

// GET /api/analytics/performance-ranking - Employee ranking
router.get(
  '/performance-ranking',
  requireAuth(['admin', 'manager']),
  validateQuery(getPerformanceRankingQuerySchema),
  analyticsController.getPerformanceRanking
);

// GET /api/analytics/export - Export data
router.get(
  '/export',
  requireAuth(['admin', 'manager']),
  validateQuery(getExportQuerySchema),
  analyticsController.exportAnalytics
);

export default router;
