import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const router = Router();

/**
 * GET /verify/:uuid
 * Route PUBLIQUE (aucune authentification) — accessible via QR code.
 */
router.get('/:uuid', asyncHandler(async (req, res) => {
  const cert = await dbAsync.get(
    'SELECT * FROM certificates WHERE certificate_uuid = ?',
    [req.params.uuid]
  );

  if (!cert) {
    return res.json({ valid: false, error: 'Certificat introuvable' });
  }

  // Vérifier la signature HMAC
  const data = `${cert.certificate_uuid}|${cert.learner_id}|${cert.issued_at}`;
  const expected = crypto.createHmac('sha256', env.certSecret).update(data).digest('hex');

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(cert.verify_signature, 'hex')
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return res.json({ valid: false, error: 'Signature invalide — certificat falsifié' });
  }

  const learner = await dbAsync.get(
    'SELECT full_name, birth_date FROM learners WHERE id = ?',
    [cert.learner_id]
  );

  const snapshot = JSON.parse(cert.modules_snapshot);

  res.json({
    valid: true,
    certificate_uuid: cert.certificate_uuid,
    issued_at: cert.issued_at,
    learner: learner ? { full_name: learner.full_name, birth_date: learner.birth_date } : null,
    modules: snapshot.modules || [],
  });
}));

export default router;
