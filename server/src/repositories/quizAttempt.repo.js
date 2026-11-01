import { dbAsync } from '../config/database.js';

export const quizAttemptRepo = {
  /**
   * Enregistre une tentative de quiz.
   */
  async create({ learner_id, quiz_id, score_percent, passed, answers_json }) {
    const result = await dbAsync.run(
      `INSERT INTO quiz_attempts (learner_id, quiz_id, score_percent, passed, answers_json)
       VALUES (?, ?, ?, ?, ?)`,
      [learner_id, quiz_id, score_percent, passed ? 1 : 0, answers_json]
    );
    return result.lastInsertRowid;
  },

  /**
   * Compte les tentatives pour un couple (apprenante, quiz).
   */
  async countByLearnerQuiz(learner_id, quiz_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM quiz_attempts WHERE learner_id = ? AND quiz_id = ?`,
      [learner_id, quiz_id]
    );
    return row?.c ?? 0;
  },

  /**
   * Historique des tentatives pour un couple (apprenante, quiz).
   */
  async findByLearnerQuiz(learner_id, quiz_id) {
    return dbAsync.all(
      `SELECT * FROM quiz_attempts
       WHERE learner_id = ? AND quiz_id = ?
       ORDER BY attempted_at DESC`,
      [learner_id, quiz_id]
    );
  },

  /**
   * Meilleur score obtenu sur un quiz.
   */
  async findBestScore(learner_id, quiz_id) {
    const row = await dbAsync.get(
      `SELECT MAX(score_percent) AS best FROM quiz_attempts
       WHERE learner_id = ? AND quiz_id = ?`,
      [learner_id, quiz_id]
    );
    return row?.best ?? null;
  },

  /**
   * Vérifie si l'apprenante a déjà réussi ce quiz au moins une fois.
   */
  async hasPassed(learner_id, quiz_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM quiz_attempts
       WHERE learner_id = ? AND quiz_id = ? AND passed = 1`,
      [learner_id, quiz_id]
    );
    return (row?.c ?? 0) > 0;
  },

  /**
   * Compte toutes les tentatives d'une apprenante (tous quiz confondus).
   */
  async countByLearner(learner_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM quiz_attempts WHERE learner_id = ?`,
      [learner_id]
    );
    return row?.c ?? 0;
  },

  /**
   * Compte le nombre de quiz distincts réussis par une apprenante.
   */
  async countPassedDistinct(learner_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(DISTINCT quiz_id) AS c FROM quiz_attempts
       WHERE learner_id = ? AND passed = 1`,
      [learner_id]
    );
    return row?.c ?? 0;
  },
};