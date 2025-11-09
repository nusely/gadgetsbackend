import { Router } from 'express';
import logController from '../controllers/log.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, logController.getAdminLogs.bind(logController));

export default router;

