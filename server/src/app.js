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

try {
  ({ globalLimiter, authLimiter } = await import('./middleware/rateLimiter.js'));
} catch {
  globalLimiter = (req, res, next) => next();
  authLimiter = (req, res, next) => next();
}

export function createApp() {
  const app = express();

  // ─── Sécurité ───
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // ─── CORS ───
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Logs ───
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // ─── Webhook AlkherPay AVANT express.json ───
  app.use(
    '/api/alkherpay/webhook',
    express.raw({ type: 'application/json', limit: '1mb' })
  );

  // ─── Parsing ───
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ─── Fichiers statiques ───
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  // ─── Health ───
  app.get('/health', (_req, res) =>
    res.json({
      status: 'ok',
      ts: Date.now(),
      env: env.nodeEnv,
      uptime: process.uptime(),
    })
  );

  // ─── Rate limiting ───
  app.use('/api', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/admin/login', authLimiter);
  app.use('/api/auth/responsible/login', authLimiter);

  // ✅ Route publique QR HORS de /api (le QR code contient /verify/:uuid)
  app.use('/verify', verifyRoutes);

  // ✅ Routes API sous /api
  app.use('/api', routes);

  // ─── 404 + erreurs ───
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
