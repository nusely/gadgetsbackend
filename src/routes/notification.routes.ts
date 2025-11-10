import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { adminAuditLogger } from '../middleware/audit.middleware';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

router.get(
  '/',
  authenticate,
  isAdmin,
  adminAuditLogger('notifications:list'),
  listNotifications
);

router.patch(
  '/:id/read',
  authenticate,
  isAdmin,
  adminAuditLogger('notifications:mark-read'),
  markNotificationRead
);

router.patch(
  '/read-all',
  authenticate,
  isAdmin,
  adminAuditLogger('notifications:mark-all-read'),
  markAllNotificationsRead
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  adminAuditLogger('notifications:delete'),
  deleteNotification
);

export default router;
