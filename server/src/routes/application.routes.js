import { Router } from 'express';
import { scholarshipController } from '../controllers/scholarship.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', scholarshipController.myApplications);

export default router;