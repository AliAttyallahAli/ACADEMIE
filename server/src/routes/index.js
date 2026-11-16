import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import moduleRoutes from './module.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import alkherpayRoutes from './alkherpay.routes.js';
import sessionRoutes from './session.routes.js';
import quizRoutes from './quizzes.routes.js';
import certificateRoutes from './certificate.routes.js';
import notificationRoutes from './notification.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import libraryRoutes from './library.routes.js';
import forumRoutes from './forum.routes.js';
import supportRoutes from './support.routes.js';
import scholarshipsRoutes from './scholarships.routes.js';
import myApplicationsRoutes from './my-applications.routes.js';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();

// ─── Public (sans auth) ───
router.use('/public', publicRoutes);

// ─── Auth ───
router.use('/auth', authRoutes);

// ─── Learner ───
router.use('/profile', profileRoutes);
router.use('/modules', moduleRoutes);
router.use('/enroll', enrollmentRoutes);
router.use('/alkherpay', alkherpayRoutes);
router.use('/sessions', sessionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/learner/dashboard', dashboardRoutes);
router.use('/library', libraryRoutes);
router.use('/forum', forumRoutes);
router.use('/support', supportRoutes);
router.use('/scholarships', scholarshipsRoutes);
router.use('/my-applications', myApplicationsRoutes);

// ⚠️ /verify N'EST PAS monté ici — il l'est dans app.js sur /verify (hors /api)

// ─── Admin ───
router.use('/admin', adminRoutes);

export default router;
