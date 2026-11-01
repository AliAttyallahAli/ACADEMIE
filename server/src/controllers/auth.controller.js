import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { learnerRepo } from '../repositories/learner.repo.js';

export const authController = {
  // POST /api/auth/register
  registerLearner: asyncHandler(async (req, res) => {
    const { full_name, birth_date, email, password } = req.body;
    const { user, token } = await authService.registerLearner({
      full_name,
      birth_date,
      email,
      password,
    });
    res.status(201).json({ success: true, user, token });
  }),

  // POST /api/auth/login
  loginLearner: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.loginLearner({ email, password });
    res.json({ success: true, user, token });
  }),

  // POST /api/auth/admin/login
  loginAdmin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.loginAdmin({ email, password });
    res.json({ success: true, user, token });
  }),

  // POST /api/auth/responsible/login
  loginResponsible: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.loginResponsible({ email, password });
    res.json({ success: true, user, token });
  }),

  // GET /api/auth/me
  me: asyncHandler(async (req, res) => {
    if (req.user.type === 'learner') {
      const user = await learnerRepo.findById(req.user.id);
      return res.json({ user: { ...user, type: 'learner' } });
    }
    // admin / responsible : payload JWT suffit
    return res.json({ user: req.user });
  }),
};