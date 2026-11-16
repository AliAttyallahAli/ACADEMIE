import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';

const router = Router();

/**
 * GET /api/public/scholarships
 * Liste des bourses PUBLIÉES (accessible sans connexion).
 */
router.get('/scholarships', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT id, type, title, description, organization, amount,
            cover_image_url, opening_date, closing_date, status,
            (SELECT COUNT(*) FROM scholarship_applications sa WHERE sa.scholarship_id = s.id) AS applications_count
     FROM scholarships s
     WHERE status = 'published'
     ORDER BY closing_date ASC`
  );
  res.json({ items });
}));

/**
 * GET /api/public/scholarships/:id
 * Détail d'une bourse publiée.
 */
router.get('/scholarships/:id', asyncHandler(async (req, res) => {
  const s = await dbAsync.get(
    `SELECT * FROM scholarships WHERE id = ? AND status = 'published'`,
    [req.params.id]
  );
  if (!s) return res.status(404).json({ error: 'Bourse introuvable' });
  res.json(s);
}));

/**
 * GET /api/public/stats
 * Statistiques globales pour la page d'accueil.
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [learners, modules, certs, scholarships] = await Promise.all([
    dbAsync.get('SELECT COUNT(*) AS c FROM learners'),
    dbAsync.get('SELECT COUNT(*) AS c FROM modules'),
    dbAsync.get('SELECT COUNT(*) AS c FROM certificates'),
    dbAsync.get(`SELECT COUNT(*) AS c FROM scholarships WHERE status = 'published'`),
  ]);
  res.json({
    learners: learners.c,
    modules: modules.c,
    certificates: certs.c,
    scholarships: scholarships.c,
  });
}));

export default router;
