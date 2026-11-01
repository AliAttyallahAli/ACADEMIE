import { dbAsync } from '../config/database.js';

export const scholarshipRepo = {
  // ═══════════ BOURSES ═══════════
  async create(data) {
    const result = await dbAsync.run(
      `INSERT INTO scholarships
        (type, title, description, organization, amount,
         opening_date, closing_date, required_documents_json,
         eligibility, status, created_by_type, created_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type,
        data.title,
        data.description ?? null,
        data.organization ?? null,
        data.amount ?? null,
        data.opening_date ?? null,
        data.closing_date ?? null,
        JSON.stringify(data.required_documents ?? []),
        data.eligibility ?? null,
        data.status ?? 'draft',
        data.created_by_type ?? null,
        data.created_by_id ?? null,
      ]
    );
    return result.lastInsertRowid;
  },

  async findById(id) {
    const s = await dbAsync.get(`SELECT * FROM scholarships WHERE id = ?`, [id]);
    if (s) s.required_documents = safeParse(s.required_documents_json);
    return s;
  },

  async findAll({ status, type, search, limit = 20, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (type) { where.push('type = ?'); params.push(type); }
    if (search) {
      where.push('(title LIKE ? OR description LIKE ? OR organization LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const sql = `
      SELECT s.*,
        (SELECT COUNT(*) FROM scholarship_applications sa WHERE sa.scholarship_id = s.id) AS applications_count
      FROM scholarships s
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    const items = await dbAsync.all(sql, params);
    return items.map((s) => ({
      ...s,
      required_documents: safeParse(s.required_documents_json),
    }));
  },

  async count({ status, type, search } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (type) { where.push('type = ?'); params.push(type); }
    if (search) {
      where.push('(title LIKE ? OR description LIKE ? OR organization LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const sql = `SELECT COUNT(*) AS c FROM scholarships ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const row = await dbAsync.get(sql, params);
    return row?.c ?? 0;
  },

  async findPublished() {
    return dbAsync.all(
      `SELECT s.*,
        (SELECT COUNT(*) FROM scholarship_applications sa
         WHERE sa.scholarship_id = s.id) AS applications_count
       FROM scholarships s
       WHERE s.status = 'published'
       ORDER BY s.closing_date ASC`
    );
  },

  async update(id, updates) {
    const allowed = [
      'type', 'title', 'description', 'organization', 'amount',
      'opening_date', 'closing_date', 'eligibility', 'status',
    ];
    const sets = [];
    const params = [];
    for (const k of allowed) {
      if (updates[k] !== undefined) {
        sets.push(`${k} = ?`);
        params.push(updates[k]);
      }
    }
    if (updates.required_documents !== undefined) {
      sets.push('required_documents_json = ?');
      params.push(JSON.stringify(updates.required_documents));
    }
    if (!sets.length) return this.findById(id);
    params.push(id);
    await dbAsync.run(`UPDATE scholarships SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    await dbAsync.run(`DELETE FROM scholarships WHERE id = ?`, [id]);
  },

  // ═══════════ CANDIDATURES ═══════════
  async createApplication(data) {
    const result = await dbAsync.run(
      `INSERT INTO scholarship_applications
        (scholarship_id, learner_id, motivation_letter, cv_url, extra_docs_json, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        data.scholarship_id,
        data.learner_id,
        data.motivation_letter ?? null,
        data.cv_url ?? null,
        JSON.stringify(data.extra_docs ?? []),
      ]
    );
    return result.lastInsertRowid;
  },

  async findApplicationById(id) {
    const a = await dbAsync.get(
      `SELECT sa.*, s.title AS scholarship_title, s.type AS scholarship_type,
              l.full_name AS learner_name, l.email AS learner_email
       FROM scholarship_applications sa
       JOIN scholarships s ON s.id = sa.scholarship_id
       JOIN learners l ON l.id = sa.learner_id
       WHERE sa.id = ?`,
      [id]
    );
    if (a) a.extra_docs = safeParse(a.extra_docs_json);
    return a;
  },

  async findApplicationByLearnerScholarship(learner_id, scholarship_id) {
    return dbAsync.get(
      `SELECT * FROM scholarship_applications
       WHERE learner_id = ? AND scholarship_id = ?`,
      [learner_id, scholarship_id]
    );
  },

  async findApplicationsByLearner(learner_id) {
    return dbAsync.all(
      `SELECT sa.*, s.title AS scholarship_title, s.type AS scholarship_type,
              s.organization, s.closing_date, s.status AS scholarship_status
       FROM scholarship_applications sa
       JOIN scholarships s ON s.id = sa.scholarship_id
       WHERE sa.learner_id = ?
       ORDER BY sa.applied_at DESC`,
      [learner_id]
    );
  },

  async findApplicationsByScholarship(scholarship_id) {
    return dbAsync.all(
      `SELECT sa.*, l.full_name AS learner_name, l.email AS learner_email,
              l.birth_date, l.country
       FROM scholarship_applications sa
       JOIN learners l ON l.id = sa.learner_id
       WHERE sa.scholarship_id = ?
       ORDER BY sa.applied_at DESC`,
      [scholarship_id]
    );
  },

  async updateApplicationStatus(id, { status, review_note, reviewer_type, reviewer_id }) {
    await dbAsync.run(
      `UPDATE scholarship_applications
       SET status = ?, review_note = ?, reviewed_by_type = ?,
           reviewed_by_id = ?, reviewed_at = datetime('now')
       WHERE id = ?`,
      [status, review_note ?? null, reviewer_type, reviewer_id, id]
    );
  },

  async countApplicationsForLearner(learner_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM scholarship_applications WHERE learner_id = ?`,
      [learner_id]
    );
    return row?.c ?? 0;
  },
};

function safeParse(s) {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}