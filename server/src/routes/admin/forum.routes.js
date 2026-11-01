import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

/**
 * GET /api/admin/forum/modules
 * Liste des modules avec leur nombre de threads.
 */
router.get('/modules', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT m.id, m.title,
      (SELECT COUNT(*) FROM forum_posts fp WHERE fp.module_id = m.id AND fp.parent_id IS NULL) AS threads_count,
      (SELECT COUNT(*) FROM forum_posts fp WHERE fp.module_id = m.id) AS posts_count
     FROM modules m
     ORDER BY m.title`
  );
  res.json({ items });
}));

/**
 * GET /api/admin/forum/module/:moduleId
 * Liste des threads d'un module.
 */
router.get('/module/:moduleId', asyncHandler(async (req, res) => {
  const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.moduleId]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const threads = await dbAsync.all(
    `SELECT fp.*, l.full_name AS author_name, l.email AS author_email,
      (SELECT COUNT(*) FROM forum_posts r WHERE r.parent_id = fp.id) AS replies_count
     FROM forum_posts fp
     JOIN learners l ON l.id = fp.learner_id
     WHERE fp.module_id = ? AND fp.parent_id IS NULL
     ORDER BY fp.created_at DESC`,
    [req.params.moduleId]
  );

  res.json({ module, threads });
}));

/**
 * GET /api/admin/forum/thread/:id
 * Détail d'un thread + réponses.
 */
router.get('/thread/:id', asyncHandler(async (req, res) => {
  const post = await dbAsync.get(
    `SELECT fp.*, l.full_name AS author_name, l.email AS author_email,
            m.title AS module_title
     FROM forum_posts fp
     JOIN learners l ON l.id = fp.learner_id
     JOIN modules m ON m.id = fp.module_id
     WHERE fp.id = ?`,
    [req.params.id]
  );
  if (!post) return res.status(404).json({ error: 'Thread introuvable' });

  const replies = await dbAsync.all(
    `SELECT fp.*, l.full_name AS author_name, l.email AS author_email
     FROM forum_posts fp
     JOIN learners l ON l.id = fp.learner_id
     WHERE fp.parent_id = ?
     ORDER BY fp.created_at ASC`,
    [req.params.id]
  );

  res.json({ post, replies });
}));

/**
 * DELETE /api/admin/forum/posts/:id
 * Supprime un post (thread ou réponse).
 */
router.delete('/posts/:id', asyncHandler(async (req, res) => {
  const post = await dbAsync.get('SELECT id FROM forum_posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });

  await dbAsync.run('DELETE FROM forum_posts WHERE parent_id = ?', [req.params.id]);
  await dbAsync.run('DELETE FROM forum_posts WHERE id = ?', [req.params.id]);

  res.json({ success: true, deleted: true });
}));

export default router;
