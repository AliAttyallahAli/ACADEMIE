import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import verifyRoutes from './routes/verify.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

let globalLimiter, authLimiter;

// Import tolérant du rateLimiter (si absent, on continue sans)
try {
  ({ globalLimiter, authLimiter } = await import('./middleware/rateLimiter.js'));
} catch {
  globalLimiter = (req, res, next) => next();
  authLimiter = (req, res, next) => next();
}

/**
 * Crée et configure l'application Express.
 * Retourne l'instance `app` non démarrée (le serveur HTTP est créé dans server.js).
 */
export function createApp() {
  const app = express();

  // ─── Sécurité ───
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // permet de servir les images /uploads
    })
  );

  // ─── CORS ───
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Logs HTTP ───
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // ⚠️ IMPORTANT : raw body pour le webhook AlkherPay AVANT express.json()
  // La signature HMAC doit être vérifiée sur le body brut
  app.use(
    '/api/alkherpay/webhook',
    express.raw({ type: 'application/json', limit: '1mb' })
  );

  // ─── Parsing ───
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ─── Fichiers statiques (uploads) ───
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  // ─── Health check ───
  app.get('/health', (_req, res) =>
    res.json({
      status: 'ok',
      ts: Date.now(),
      env: env.nodeEnv,
      uptime: process.uptime(),
    })
  );

  // ─── Rate limiting (global + auth) ───
  app.use('/api', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/admin/login', authLimiter);
  app.use('/api/auth/responsible/login', authLimiter);

  // ─── Route publique de vérification QR (hors /api) ───
  // URL dans le QR code : ${env.baseUrl}/verify/:uuid
  app.use('/verify', verifyRoutes);

  // ─── Routes API principales ───
  app.use('/api', routes);

  // ─── 404 + gestion d'erreurs ───
  app.use(notFound);
  app.use(errorHandler);

  return app;
}