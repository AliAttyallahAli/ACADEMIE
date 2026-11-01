export const ENDPOINTS = {
  // ═══════════════ AUTH ═══════════════
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    adminLogin: '/auth/admin/login',
    responsibleLogin: '/auth/responsible/login',
    me: '/auth/me',
  },

  // ═══════════════ LEARNER ═══════════════
  dashboard: '/learner/dashboard',
  modules: '/modules',
  sessions: (id) => `/sessions/${id}`,
  quizBySession: (sid) => `/quizzes/session/${sid}`,
  quizSubmit: (qid) => `/quizzes/${qid}/submit`,
  quizAttempts: (qid) => `/quizzes/${qid}/attempts`,
  enroll: '/enroll',
  myEnrollments: '/enroll/my',
  alkherpaySimulate: '/alkherpay/simulate',
  library: '/library',

  // ═══════════════ NOTIFICATIONS ═══════════════
  notifications: '/notifications',
  notificationsCount: '/notifications/count',
  notificationRead: (id) => `/notifications/${id}/read`,
  notificationsReadAll: '/notifications/read-all',
  notificationDelete: (id) => `/notifications/${id}`,

  // ═══════════════ CERTIFICATS ═══════════════
  certificates: '/certificates',
  certificateDownload: (uuid) => `/certificates/${uuid}/download`,
  verify: (uuid) => `/verify/${uuid}`,

  // ═══════════════ BOURSES (learner) ═══════════════
  scholarships: '/scholarships',
  scholarship: (id) => `/scholarships/${id}`,
  scholarshipApply: (id) => `/scholarships/${id}/apply`,
  myApplications: '/my-applications',

  // ═══════════════ PROFIL ═══════════════
  profile: {
    get: '/profile',
    update: '/profile',
    photo: '/profile/photo',
    password: '/profile/password',
  },

  // ═══════════════ FORUM (learner) ═══════════════
  forum: {
    createPost: '/forum',
    moduleThreads: (id) => `/forum/module/${id}`,
    thread: (id) => `/forum/${id}`,
    deletePost: (id) => `/forum/${id}`,
  },

  // ═══════════════ SUPPORT (learner) ═══════════════
  support: {
    create: '/support',
    list: '/support',
    ticket: (id) => `/support/${id}`,
  },

  // ═══════════════ ADMIN ═══════════════
  admin: {
    // ─── Stats ───
    stats: '/admin/stats',

    // ─── Modules ───
    modules: '/admin/modules',
    module: (id) => `/admin/modules/${id}`,
    moduleCover: (id) => `/admin/modules/${id}/cover`,
    moduleRegenerate: (id) => `/admin/modules/${id}/regenerate-sessions`,

    // ─── Niveaux (Levels) ───
    levelsByModule: (mid) => `/admin/levels/module/${mid}`,
    level: (id) => `/admin/levels/${id}`,
    levelCreate: (mid) => `/admin/levels/module/${mid}`,

    // ─── Séances (Sessions) ───
    sessionsByModule: (mid) => `/admin/sessions/module/${mid}`,
    session: (id) => `/admin/sessions/${id}`,
    sessionUpload: (id) => `/admin/sessions/${id}/upload`,
    sessionCreate: (mid) => `/admin/sessions/module/${mid}`,

    // ─── Quiz ───
    quizBySession: (sid) => `/admin/quizzes/session/${sid}`,
    quizAttempts: (qid) => `/admin/quizzes/${qid}/attempts`,

    // ─── Inscriptions ───
    enrollments: '/admin/enrollments',
    enrollmentsPending: '/admin/enrollments/pending',
    enrollmentValidate: (id) => `/admin/enrollments/${id}/validate`,
    enrollmentReject: (id) => `/admin/enrollments/${id}/reject`,
    enrollmentManual: '/admin/enrollments/manual',

    // ─── Apprenantes ───
    learners: '/admin/learners',
    learner: (id) => `/admin/learners/${id}`,

    // ─── Bourses ───
    scholarships: '/admin/scholarships',
    scholarship: (id) => `/admin/scholarships/${id}`,
    scholarshipCover: (id) => `/admin/scholarships/${id}/cover`,
    scholarshipPublish: (id) => `/admin/scholarships/${id}/publish`,
    scholarshipClose: (id) => `/admin/scholarships/${id}/close`,
    scholarshipApplications: (id) => `/admin/scholarships/${id}/applications`,
    reviewApplication: (id) => `/admin/scholarships/applications/${id}/review`,
    allApplications: '/admin/scholarships/applications/all',

    // ─── Forum ───
    forumModules: '/admin/forum/modules',
    forumByModule: (mid) => `/admin/forum/module/${mid}`,
    forumThread: (id) => `/admin/forum/thread/${id}`,
    forumDeletePost: (id) => `/admin/forum/posts/${id}`,

    // ─── Support ───
    supportTickets: '/admin/support',
    supportReply: (id) => `/admin/support/${id}/reply`,
    supportClose: (id) => `/admin/support/${id}/close`,

    // ─── Responsables ───
    responsibles: '/admin/responsibles',
    responsible: (id) => `/admin/responsibles/${id}`,
    responsibleToggle: (id) => `/admin/responsibles/${id}/toggle`,
    responsibleReset: (id) => `/admin/responsibles/${id}/reset-password`,
    responsibleActivity: (id) => `/admin/responsibles/${id}/activity`,

    // ─── Audit log ───
    auditLog: '/admin/audit-log',
    auditLogExport: '/admin/audit-log/export/csv',
  },
};
