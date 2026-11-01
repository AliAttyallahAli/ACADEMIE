import { Router } from 'express';
import { scholarshipController } from '../controllers/scholarship.controller.js';
import {
  idParamValidator,
  applyValidator,
} from '../validators/scholarship.validator.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadScholarshipDocs } from '../middleware/uploadDocuments.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', scholarshipController.list);
router.get('/:id', idParamValidator, validateRequest, scholarshipController.getById);

router.post(
  '/:id/apply',
  uploadScholarshipDocs.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'extra_docs', maxCount: 5 },
  ]),
  applyValidator,
  validateRequest,
  scholarshipController.apply
);

export default router;