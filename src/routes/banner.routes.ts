import { Router } from 'express';
import {
  getBannersByType,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/banner.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/:type', getBannersByType);

// Admin routes
router.get('/', authenticate, isAdmin, getAllBanners);
router.post('/', authenticate, isAdmin, createBanner);
router.put('/:id', authenticate, isAdmin, updateBanner);
router.delete('/:id', authenticate, isAdmin, deleteBanner);

export default router;



