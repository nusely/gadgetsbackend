import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { adminAuditLogger } from '../middleware/audit.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  isAdmin,
  adminAuditLogger('customers:create'),
  customerController.createCustomer.bind(customerController)
);

export default router;
