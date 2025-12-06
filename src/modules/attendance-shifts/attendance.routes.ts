import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { 
  checkIn, 
  checkOut, 
  getMyAttendance, 
  manualAdjust, 
  getMonthlyReport 
} from "./attendance.controller";
import { 
  checkInSchema, 
  checkOutSchema, 
  manualAdjustSchema 
} from "./attendance.dto";

const router = Router();

// ============================================
// EMPLOYEE ENDPOINTS
// ============================================
// POST /attendance/check-in - Employee check-in
router.post(
  "/check-in", 
  requireAuth(), 
  validateBody(checkInSchema), 
  checkIn
);

// POST /attendance/check-out - Employee check-out
router.post(
  "/check-out", 
  requireAuth(), 
  validateBody(checkOutSchema), 
  checkOut
);

// GET /attendance/my-attendance - View my attendance history
router.get(
  "/my-attendance", 
  requireAuth(), 
  getMyAttendance
);

// GET /attendance/report - Monthly attendance report
router.get(
  "/report", 
  requireAuth(), 
  // Note: Service uses admin client internally, no collection permission needed
  getMonthlyReport
);

// ============================================
// ADMIN ENDPOINTS
// ============================================
// PATCH /attendance/:id/manual-adjust - Admin manual adjustment
router.patch(
  "/:id/manual-adjust",
  requireAuth(),
  checkPermission('update', 'attendance_shifts'),
  validateBody(manualAdjustSchema),
  manualAdjust
);

export default router;
