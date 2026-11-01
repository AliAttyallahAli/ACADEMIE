import { dashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = {
  /**
   * GET /api/learner/dashboard
   * Retourne tout ce dont l'apprenante a besoin à la connexion.
   */
  get: asyncHandler(async (req, res) => {
    const data = await dashboardService.getDashboard(req.user.id);
    res.json(data);
  }),
};