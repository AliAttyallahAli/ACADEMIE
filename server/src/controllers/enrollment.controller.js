import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';

export const enrollmentController = {
  /**
   * POST /api/enroll
   * Body : { module_ids: [1, 2], start_date: 'YYYY-MM-DD' }
   */
  enroll: asyncHandler(async (req, res) => {
    const learner_id = req.user.id;
    const { module_ids, start_date } = req.body;

    if (!Array.isArray(module_ids) || module_ids.length === 0) {
      return res.status(422).json({ error: 'Au moins un module requis' });
    }

    const created = [];
    for (const module_id of module_ids) {
      // Vérifier si déjà inscrite
      const existing = await dbAsync.get(
        'SELECT id, payment_status FROM enrollments WHERE learner_id = ? AND module_id = ?',
        [learner_id, module_id]
      );

      if (existing) {
        created.push({ id: existing.id, module_id, already: true, payment_status: existing.payment_status });
        continue;
      }

      // Vérifier que le module existe
      const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [module_id]);
      if (!module) {
        return res.status(404).json({ error: `Module ${module_id} introuvable` });
      }

      // Créer l'inscription en attente
      const result = await dbAsync.run(
        `INSERT INTO enrollments (learner_id, module_id, start_date, payment_status)
         VALUES (?, ?, ?, 'pending')`,
        [learner_id, module_id, start_date]
      );

      created.push({ id: result.lastInsertRowid, module_id, payment_status: 'pending' });
    }

    // Générer une référence AlkherPay (simulée)
    const reference = `ALK-${learner_id}-${Date.now()}`;

    res.status(201).json({
      success: true,
      enrollments: created,
      payment: {
        payment_url: `http://localhost:5173/payment/simulate?ref=${reference}`,
        reference,
        simulated: true,
      },
      amount: 25000 * created.filter((c) => !c.already).length,
    });
  }),

  /**
   * GET /api/enroll/my
   * Liste les inscriptions de l'apprenante connectée.
   */
  myEnrollments: asyncHandler(async (req, res) => {
    const items = await dbAsync.all(
      `SELECT e.*, m.title AS module_title, m.duration_weeks,
              m.frequency_per_week, m.cover_image_url
       FROM enrollments e
       JOIN modules m ON m.id = e.module_id
       WHERE e.learner_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    res.json({ items });
  }),
};
