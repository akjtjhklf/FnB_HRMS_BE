import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware';
import { createAttendanceLogSchema, CreateAttendanceLogDto } from '../attendance-logs/attendance-log.dto';
import AttendanceLogService from '../attendance-logs/attendance-log.service';
import { ApiResponse } from '../../core/response';

const router = Router();
const attendanceLogService = new AttendanceLogService();

// Webhook to receive RFID events from devices
router.post('/', validateBody(createAttendanceLogSchema), async (req, res: import('express').Response<ApiResponse<unknown>>) => {
  const payload = req.body as CreateAttendanceLogDto;
  const log = await attendanceLogService.create({
    ...payload,
    event_type: payload.event_type ?? 'tap',
  });
  return res.status(201).json({ success: true, data: log });
});

export default router;

