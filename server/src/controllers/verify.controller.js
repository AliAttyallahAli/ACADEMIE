import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyController = {
  verify: asyncHandler(async (req, res) => {
    // TODO: implémenter la vraie vérification par UUID
    // Pour l'instant, réponse stub
    res.json({
      valid: false,
      error: 'Vérification non implémentée',
      certificate_uuid: req.params.uuid,
    });
  }),
};