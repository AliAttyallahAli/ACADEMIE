import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { checkSessionAccess } from '../middleware/checkSessionAccess.js';
import { sessionIdParamValidator } from '../validators/quizSubmission.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(authenticateJWT);

router.get(
  '/:id',
  sessionIdParamValidator,
  validateRequest,
  checkSessionAccess,
  sessionController.getById
);

export default router;