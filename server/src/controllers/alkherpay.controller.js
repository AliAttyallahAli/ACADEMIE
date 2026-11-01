import { asyncHandler } from '../utils/asyncHandler.js';

export const alkherpayController = {
  webhook: asyncHandler(async (req, res) => {
    res.json({ received: true });
  }),

  simulateSuccess: asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Simulation désactivée en production' });
    }
    res.json({ success: true, results: [] });
  }),
};