import { Router } from 'express';
import { supportAdminController } from '../../controllers/admin/support.controller.js';
import { replyTicketValidator } from '../../validators/forum.validator.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', requirePermission('support', 'read'), supportAdminController.listAll);
router.post('/:id/reply', requirePermission('support', 'reply'), replyTicketValidator, validateRequest, supportAdminController.reply);
router.post('/:id/close', requirePermission('support', 'reply'), supportAdminController.close);

export default router;