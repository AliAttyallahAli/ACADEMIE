import { Router } from 'express';
import { verifyController } from '../controllers/verify.controller.js';

const router = Router();

/**
 * GET /verify/:uuid
 * Route PUBLIQUE (aucune authentification) — accessible via QR code.
 * Vérifie l'authenticité d'un certificat par son UUID.
 *
 * Réponse :
 *   { valid: true, learner, modules, issued_at }
 *   ou { valid: false, error }
 */
router.get('/:uuid', verifyController.verify);

export default router;