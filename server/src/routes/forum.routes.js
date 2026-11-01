import { Router } from 'express';
import { forumController } from '../controllers/forum.controller.js';
import {
  createForumPostValidator,
  forumIdValidator,
  moduleIdValidator,
} from '../validators/forum.validator.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(authenticateJWT);

router.post('/', createForumPostValidator, validateRequest, forumController.createPost);
router.get('/module/:moduleId', moduleIdValidator, validateRequest, forumController.listModuleThreads);
router.get('/:id', forumIdValidator, validateRequest, forumController.getThread);
router.delete('/:id', forumIdValidator, validateRequest, forumController.deletePost);

export default router;