import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware';
import { login, logout, refresh, getMe } from './auth.controller';
import { loginSchema, refreshTokenSchema } from './auth.dto';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', validateBody(refreshTokenSchema), refresh);
router.get('/me', requireAuth(), getMe);
export default router;

