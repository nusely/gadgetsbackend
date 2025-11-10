import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { adminAuditLogger } from '../middleware/audit.middleware';

const router = Router();

router.post(
  '/link-user',
  authenticate,
  customerController.linkCustomerToUser.bind(customerController)
);

router.get(
  '/',
  authenticate,
  isAdmin,
  adminAuditLogger('customers:list'),
  customerController.listCustomers.bind(customerController)
);

export default router;
