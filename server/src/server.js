import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { getDb, closeDb } from './config/database.js';

// ─── Import conditionnels (évitent les crashs si un module n'existe pas) ───
let registerNotificationSocket;
let startJobs;

try {
  ({ registerNotificationSocket } = await import('./sockets/notification.socket.js'));
} catch (e) {
  logger.warn('⚠️  notification.socket.js introuvable, Socket.IO désactivé');
  registerNotificationSocket = null;
}

try {
  ({ startJobs } = await import('./jobs/index.js'));
} catch (e) {
  logger.warn('⚠️  jobs/index.js introuvable, cron jobs désactivés');
  startJobs = null;
}

// ─── Bootstrap ───
async function bootstrap() {
  // 1. Vérifier la base de données
  try {
    getDb();
    logger.info(`🗄️  Base SQLite : ${env.dbPath}`);
  } catch (e) {
    logger.error('❌ Impossible d\'ouvrir la base :', e.message);
    logger.error('   → Lancez : node src/db/init.js');
    process.exit(1);
  }

  // 2. Créer l'app Express
  const app = createApp();
  const server = http.createServer(app);

  // 3. Socket.IO
  let io = null;
  if (registerNotificationSocket) {
    try {
      io = new SocketServer(server, {
        cors: {
          origin: env.clientUrl,
          credentials: true,
        },
      });
      registerNotificationSocket(io);
      app.set('io', io);
      global.__io = io;
      logger.info('🔌 Socket.IO configuré');
    } catch (e) {
      logger.warn('⚠️  Socket.IO échec :', e.message);
    }
  }

  // 4. Cron jobs
  if (startJobs) {
    try {
      startJobs();
    } catch (e) {
      logger.warn('⚠️  Cron jobs échec :', e.message);
    }
  }

  // 5. Gérer EADDRINUSE proprement
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Le port ${env.port} est déjà utilisé`);
      logger.error(`   → Identifiez le processus : lsof -i :${env.port}`);
      logger.error(`   → Tuez-le : kill -9 $(lsof -t -i:${env.port})`);
      logger.error(`   → Ou changez PORT dans .env`);
      process.exit(1);
    }
    logger.error('❌ Erreur serveur :', err.message);
    process.exit(1);
  });

  // 6. Démarrer
  server.listen(env.port, () => {
    logger.success(`🚀 ALKHER ACADEMY API démarrée sur ${env.baseUrl}`);
    logger.info(`🌍 Environnement : ${env.nodeEnv}`);
    logger.info(`🔗 CORS autorisé : ${env.clientUrl}`);
  });

  // 7. Arrêt propre
  const shutdown = async (signal) => {
    logger.warn(`\n⏹️  Signal ${signal} reçu — arrêt en cours...`);

    server.close(async () => {
      try {
        if (io) io.close();
        await closeDb();
        logger.success('✅ Arrêt propre terminé');
        process.exit(0);
      } catch (e) {
        logger.error('❌ Erreur lors de l\'arrêt :', e.message);
        process.exit(1);
      }
    });

    // Force-quit après 5s si bloqué
    setTimeout(() => {
      logger.error('⚠️  Arrêt forcé après timeout');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 8. Gestion des erreurs non capturées
  process.on('unhandledRejection', (reason) => {
    logger.error('❌ Promise rejetée non gérée :', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('❌ Exception non capturée :', err.message);
    logger.error(err.stack);
    // Ne pas exit : laisser le serveur continuer si possible
  });

  return { server, io };
}

// ─── Lancer ───
bootstrap().catch((e) => {
  logger.error('❌ Erreur fatale au démarrage :', e.message);
  logger.error(e.stack);
  process.exit(1);
});