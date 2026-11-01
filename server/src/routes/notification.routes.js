import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', notificationController.list);
router.get('/count', notificationController.count);
router.post('/read-all', notificationController.markAllRead);
router.post('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.remove);

export default router;