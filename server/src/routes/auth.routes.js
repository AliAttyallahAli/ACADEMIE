import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import {
  registerLearnerValidator,
  loginValidator,
} from '../validators/auth.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

// ─── APPRENANTE ───
router.post(
  '/register',
  registerLearnerValidator,
  validateRequest,
  authController.registerLearner
);
router.post('/login', loginValidator, validateRequest, authController.loginLearner);

// ─── ADMIN ───
router.post('/admin/login', loginValidator, validateRequest, authController.loginAdmin);

// ─── RESPONSABLE ───
router.post(
  '/responsible/login',
  loginValidator,
  validateRequest,
  authController.loginResponsible
);

// ─── SESSION ───
router.get('/me', authenticateJWT, authController.me);

export default router;