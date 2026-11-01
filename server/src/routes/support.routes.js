import { Router } from 'express';
import { supportController } from '../controllers/support.controller.js';
import { createSupportTicketValidator } from '../validators/forum.validator.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(authenticateJWT);

router.post('/', createSupportTicketValidator, validateRequest, supportController.createTicket);
router.get('/', supportController.listMyTickets);
router.get('/:id', supportController.getTicket);

export default router;