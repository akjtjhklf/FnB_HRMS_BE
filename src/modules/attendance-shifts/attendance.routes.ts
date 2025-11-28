import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { checkIn, checkOut, getMyAttendance, manualAdjust } from "./attendance.controller";

const router = Router();

// ============================================
// EMPLOYEE ENDPOINTS
// ============================================
// POST /attendance/check-in - Employee check-in
router.post("/check-in", requireAuth(), checkIn);

// POST /attendance/check-out - Employee check-out
router.post("/check-out", requireAuth(), checkOut);

// GET /attendance/my-attendance - View my attendance history
router.get("/my-attendance", requireAuth(), getMyAttendance);

// ============================================
// ADMIN ENDPOINTS
// ============================================
// PATCH /attendance/:id/manual-adjust - Admin manual adjustment
router.patch(
  "/:id/manual-adjust",
  requireAuth(),
  checkPermission('update', 'attendance_shifts'),
  manualAdjust
);

export default router;
