import { Router } from 'express';

import authRoutes from './auth.routes.js';
import moduleRoutes from './module.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import sessionRoutes from './session.routes.js';
import quizRoutes from './quiz.routes.js';
import certificateRoutes from './certificate.routes.js';
import notificationRoutes from './notification.routes.js';
import profileRoutes from './profile.routes.js';
import forumRoutes from './forum.routes.js';
import libraryRoutes from './library.routes.js';       // ← AJOUT
import supportRoutes from './support.routes.js';
import scholarshipRoutes from './scholarship.routes.js';
import applicationRoutes from './application.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import alkherpayRoutes from './alkherpay.routes.js';
import verifyRoutes from './verify.routes.js';
import adminRoutes from './admin/index.js';


const router = Router();

// Route de test
router.get('/', (_req, res) => {
  res.json({
    name: 'ALKHER ACADEMY API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/modules', moduleRoutes);
router.use('/enroll', enrollmentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/forum', forumRoutes);
router.use('/support', supportRoutes);
router.use('/scholarships', scholarshipRoutes);
router.use('/my-applications', applicationRoutes);
router.use('/learner/dashboard', dashboardRoutes);
router.use('/alkherpay', alkherpayRoutes);
router.use('/verify', verifyRoutes);
router.use('/admin', adminRoutes);
router.use('/library', libraryRoutes);                 // ← AJOUT


export default router;