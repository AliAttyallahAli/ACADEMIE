-- ═══════════════════════════════════════════════════════════════════
-- ALKHER ACADEMY — Schéma SQLite
-- ═══════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ─── APPRENANTES ───
CREATE TABLE IF NOT EXISTS learners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- ─── SUPER-ADMINS ───
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── RESPONSABLES ───
CREATE TABLE IF NOT EXISTS responsibles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_by_admin_id INTEGER,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
);

-- ─── MODULES ───
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  duration_weeks INTEGER NOT NULL,
  frequency_per_week INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── SÉANCES ───
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  scheduled_date TEXT NOT NULL,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ─── INSCRIPTIONS ───
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  enrolled_at TEXT DEFAULT (datetime('now')),
  start_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  payment_status TEXT DEFAULT 'pending',
  payment_ref TEXT,
  validated_by TEXT,
  validated_by_admin_id INTEGER,
  validation_note TEXT,
  validated_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  UNIQUE (learner_id, module_id)
);

-- ─── QUIZ ───
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL UNIQUE,
  pass_threshold INTEGER DEFAULT 60,
  max_attempts INTEGER DEFAULT 3,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL,
  quiz_id INTEGER NOT NULL,
  score_percent REAL NOT NULL,
  passed INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  attempted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

CREATE TABLE IF NOT EXISTS session_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  is_unlocked INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  unlocked_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  UNIQUE (learner_id, session_id)
);

-- ─── RESSOURCES ───
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  session_id INTEGER,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ─── FORUM ───
CREATE TABLE IF NOT EXISTS forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  learner_id INTEGER NOT NULL,
  parent_id INTEGER,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (parent_id) REFERENCES forum_posts(id)
);

-- ─── SUPPORT ───
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);

-- ─── CERTIFICATS ───
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_uuid TEXT UNIQUE NOT NULL,
  learner_id INTEGER NOT NULL,
  issued_at TEXT DEFAULT (datetime('now')),
  modules_snapshot TEXT NOT NULL,
  verify_signature TEXT NOT NULL,
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);

-- ─── NOTIFICATIONS ───
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  icon TEXT,
  color TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);

-- ─── JOURNAL D'AUDIT ───
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  actor_name TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  details_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── BOURSES ───
CREATE TABLE IF NOT EXISTS scholarships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  organization TEXT,
  amount TEXT,
  opening_date TEXT,
  closing_date TEXT,
  required_documents_json TEXT,
  eligibility TEXT,
  status TEXT DEFAULT 'draft',
  created_by_type TEXT,
  created_by_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scholarship_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scholarship_id INTEGER NOT NULL,
  learner_id INTEGER NOT NULL,
  motivation_letter TEXT,
  cv_url TEXT,
  extra_docs_json TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by_type TEXT,
  reviewed_by_id INTEGER,
  review_note TEXT,
  applied_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (scholarship_id) REFERENCES scholarships(id),
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);

-- ─── INDEX ───
CREATE INDEX IF NOT EXISTS idx_sessions_module ON sessions(module_id, session_number);
CREATE INDEX IF NOT EXISTS idx_progress_learner ON session_progress(learner_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner_quiz ON quiz_attempts(learner_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_notif_learner_unread ON notifications(learner_id, is_read);
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON scholarships(status, closing_date);
CREATE INDEX IF NOT EXISTS idx_responsibles_active ON responsibles(is_active, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_unique ON scholarship_applications(scholarship_id, learner_id);