/**
 * Enveloppe un handler async pour capturer les erreurs
 * et les transmettre au middleware errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);