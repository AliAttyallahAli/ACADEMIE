import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LearnerLayout from './layouts/LearnerLayout';
import Spinner from './components/Spinner';
import InstallBanner from './components/InstallBanner';
import UpdatePrompt from './components/UpdatePrompt';

// ═══════════════════════════════════════════════════════
// PUBLIC
// ═══════════════════════════════════════════════════════
const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const VerifyPage = lazy(() => import('./pages/public/VerifyPage'));
const Unauthorized = lazy(() => import('./pages/public/Unauthorized'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

// ═══════════════════════════════════════════════════════
// LEARNER
// ═══════════════════════════════════════════════════════
const Dashboard = lazy(() => import('./pages/learner/Dashboard'));
const Modules = lazy(() => import('./pages/learner/Modules'));
const SessionView = lazy(() => import('./pages/learner/SessionView'));
const QuizPage = lazy(() => import('./pages/learner/QuizPage'));
const Library = lazy(() => import('./pages/learner/Library'));
const Scholarships = lazy(() => import('./pages/learner/Scholarships'));
const ScholarshipDetail = lazy(() => import('./pages/learner/ScholarshipDetail'));
const MyApplications = lazy(() => import('./pages/learner/MyApplications'));
const ProfilePage = lazy(() => import('./pages/learner/ProfilePage'));
const Notifications = lazy(() => import('./pages/learner/Notifications'));
const Orientation = lazy(() => import('./pages/learner/Orientation'));
const CertificateView = lazy(() => import('./pages/learner/CertificateView'));
const Forum = lazy(() => import('./pages/learner/Forum'));
const Support = lazy(() => import('./pages/learner/Support'));

// ═══════════════════════════════════════════════════════
// ADMIN / RESPONSABLE
// ═══════════════════════════════════════════════════════
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminModules = lazy(() => import('./pages/admin/Modules'));
const AdminModuleLevels = lazy(() => import('./pages/admin/ModuleLevels'));
const AdminModuleSessions = lazy(() => import('./pages/admin/ModuleSessions'));
const AdminQuizEditor = lazy(() => import('./pages/admin/QuizEditor'));
const AdminLearners = lazy(() => import('./pages/admin/Learners'));
const AdminEnrollments = lazy(() => import('./pages/admin/Enrollments'));
const AdminScholarships = lazy(() => import('./pages/admin/Scholarships'));
const AdminScholarshipApplications = lazy(() => import('./pages/admin/ScholarshipApplications'));
const AdminApplications = lazy(() => import('./pages/admin/Applications'));
const AdminForum = lazy(() => import('./pages/admin/Forum'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminResponsibles = lazy(() => import('./pages/admin/Responsibles'));
const AdminAuditLog = lazy(() => import('./pages/admin/AuditLog'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ═══════════ PUBLIC ═══════════ */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/verify/:uuid" element={<VerifyPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ═══════════ LEARNER (protégé) ═══════════ */}
              <Route
                element={
                  <ProtectedRoute roles={['learner']}>
                    <LearnerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/modules" element={<Modules />} />
                <Route path="/sessions/:id" element={<SessionView />} />
                <Route path="/quiz/:sessionId" element={<QuizPage />} />
                <Route path="/library" element={<Library />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/orientation" element={<Orientation />} />
                <Route path="/certificate/:uuid" element={<CertificateView />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/support" element={<Support />} />
              </Route>

              {/* ═══════════ ADMIN / RESPONSABLE (protégé) ═══════════ */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin', 'responsible']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />

                {/* ─── Dashboard (stats) ─── */}
                <Route path="dashboard" element={<AdminDashboard />} />

                {/* ─── Modules ─── */}
                <Route path="modules" element={<AdminModules />} />
                <Route path="modules/:id/levels" element={<AdminModuleLevels />} />
                <Route path="modules/:id/sessions" element={<AdminModuleSessions />} />
                <Route path="modules/:id/sessions/:sessionId/quiz" element={<AdminQuizEditor />} />

                {/* ─── Apprenantes ─── */}
                <Route path="learners" element={<AdminLearners />} />

                {/* ─── Inscriptions ─── */}
                <Route path="enrollments" element={<AdminEnrollments />} />

                {/* ─── Bourses ─── */}
                <Route path="scholarships" element={<AdminScholarships />} />
                <Route path="scholarships/:id/applications" element={<AdminScholarshipApplications />} />
                <Route path="applications" element={<AdminApplications />} />

                {/* ─── Forum ─── */}
                <Route path="forum" element={<AdminForum />} />

                {/* ─── Support ─── */}
                <Route path="support" element={<AdminSupport />} />

                {/* ─── Responsables (SUPER-ADMIN uniquement) ─── */}
                <Route
                  path="responsibles"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminResponsibles />
                    </ProtectedRoute>
                  }
                />

                {/* ─── Audit log (SUPER-ADMIN uniquement) ─── */}
                <Route
                  path="audit-log"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminAuditLog />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ═══════════ 404 ═══════════ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <InstallBanner />
          <UpdatePrompt />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
