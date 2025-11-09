import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware';
import { login, logout, refresh } from './auth.controller';
import { LoginDto } from './auth.dto';

const router = Router();
router.post('/login', validateBody(LoginDto), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
export default router;

