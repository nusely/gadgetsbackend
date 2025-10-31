import express from 'express';
import { contactController } from '../controllers/contact.controller';

const router = express.Router();

// Contact form submission
router.post('/', contactController.submitContactForm);

export default router;
