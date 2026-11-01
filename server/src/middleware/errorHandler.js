import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  // Log complet dans le terminal
  logger.error('═══════════ ERREUR ═══════════');
  logger.error(`${req.method} ${req.originalUrl}`);
  logger.error('Message :', err.message);
  logger.error('Stack :', err.stack);
  logger.error('══════════════════════════════');

  const status = err.status || err.statusCode || 500;

  // En développement, exposer le message ET la stack
  res.status(status).json({
    error: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      path: req.originalUrl,
    }),
  });
}
