import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', certificateController.list);
router.get('/:uuid', certificateController.getOne);
router.get('/:uuid/download', certificateController.download);

export default router;