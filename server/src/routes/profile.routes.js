import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import {
  updateProfileValidator,
  changePasswordValidator,
} from '../validators/profile.validator.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = Router();

// Toutes les routes : apprenante authentifiée
router.use(authenticateJWT);

router.get('/', profileController.get);
router.put('/', updateProfileValidator, validateRequest, profileController.update);

router.post('/photo', uploadPhoto.single('photo'), profileController.uploadPhoto);
router.delete('/photo', profileController.deletePhoto);

router.put(
  '/password',
  changePasswordValidator,
  validateRequest,
  profileController.changePassword
);

export default router;