import express from 'express';
const router = express.Router();

import authController from '../controllers/authController.js';
import chatController from '../controllers/chatController.js';
import appointmentController from '../controllers/appointmentController.js';
import businessController from '../controllers/businessController.js';
import authenticateToken from '../middleware/auth.js';
import { authLimiter, appointmentLimiter } from '../middleware/rateLimiter.js';
import { validateRegister, validateLogin, validateAppointment } from '../middleware/validator.js';

// Auth routes (protected by authLimiter & validation)
router.post('/auth/register', authLimiter, validateRegister, authController.register);
router.post('/auth/login', authLimiter, validateLogin, authController.login);

// Business routes (Multi-tenancy directory)
router.get('/businesses', businessController.getBusinesses);
router.get('/businesses/:id', businessController.getBusinessById);

// Chat routes (Message sending handled via WebSockets in socket.js)
router.get('/chat/session/:id', authenticateToken, chatController.getSession);

// Appointment routes (creation protected by appointmentLimiter & validation)
router.post('/appointments', authenticateToken, appointmentLimiter, validateAppointment, appointmentController.createAppointment);
router.get('/appointments', authenticateToken, appointmentController.getAppointments);
router.get('/appointments/booked', authenticateToken, appointmentController.getBookedSlots);
router.get('/appointments/check', authenticateToken, appointmentController.checkAvailability);
router.delete('/appointments/:id', authenticateToken, appointmentController.cancelAppointment);

export default router;
