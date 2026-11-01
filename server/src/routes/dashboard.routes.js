import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', dashboardController.get);

export default router;