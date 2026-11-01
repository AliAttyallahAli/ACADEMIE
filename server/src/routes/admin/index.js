import { Router } from 'express';
import modulesRoutes from './modules.routes.js';
import levelsRoutes from './levels.routes.js';
import sessionsRoutes from './sessions.routes.js';
import quizzesRoutes from './quizzes.routes.js';
import enrollmentsRoutes from './enrollments.routes.js';
import learnersRoutes from './learners.routes.js';
import scholarshipsRoutes from './scholarships.routes.js';
import responsiblesRoutes from './responsibles.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import forumRoutes from './forum.routes.js';
import supportRoutes from './support.routes.js';
import statsRoutes from './stats.routes.js';


const router = Router();

router.use('/modules', modulesRoutes);
router.use('/levels', levelsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/quizzes', quizzesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/learners', learnersRoutes);
router.use('/scholarships', scholarshipsRoutes);
router.use('/responsibles', responsiblesRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/forum', forumRoutes);
router.use('/support', supportRoutes);
router.use('/stats', statsRoutes);


export default router;
