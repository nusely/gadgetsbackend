import express from 'express';
import { OrderController } from '../controllers/order.controller';

const router = express.Router();
const orderController = new OrderController();

// Get all orders (admin only)
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', orderController.cancelOrder);

// Create order
router.post('/', orderController.createOrder);

// Send wishlist reminder
router.post('/wishlist-reminder/:user_id', orderController.sendWishlistReminder);

// Send cart abandonment reminder
router.post('/cart-abandonment-reminder', orderController.sendCartAbandonmentReminder);

// Download order PDF
router.get('/:id/pdf', orderController.downloadOrderPDF);

export default router;