import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

router.post('/', enrollmentController.enroll);
router.get('/my', enrollmentController.myEnrollments);

export default router;
