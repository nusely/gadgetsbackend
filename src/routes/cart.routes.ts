import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { cartSyncSchema } from '../validation/schemas';

const router = Router();

router.get('/', authenticate, cartController.getCart.bind(cartController));
router.put('/', authenticate, validateBody(cartSyncSchema), cartController.replaceCart.bind(cartController));
router.delete('/', authenticate, cartController.clearCart.bind(cartController));
router.delete('/:productId', authenticate, cartController.removeItem.bind(cartController));

export default router;
