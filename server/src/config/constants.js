export const ROLES = Object.freeze({
  LEARNER: 'learner',
  ADMIN: 'admin',
  RESPONSIBLE: 'responsible',
});

export const RESPONSIBLE_ROLES = Object.freeze([
  'pedagogique',
  'inscriptions',
  'bourses',
  'support',
  'lecture',
]);

export const NOTIFICATION_TYPES = Object.freeze({
  SESSION_UNLOCKED: 'session_unlocked',
  QUIZ_PASSED: 'quiz_passed',
  QUIZ_FAILED: 'quiz_failed',
  MODULE_COMPLETED: 'module_completed',
  FORMATION_COMPLETED: 'formation_completed',
  CERTIFICATE_ISSUED: 'certificate_issued',
  ENROLLMENT_VALIDATED: 'enrollment_validated',
  FORUM_REPLY: 'forum_reply',
  SUPPORT_REPLY: 'support_reply',
  ANNOUNCEMENT: 'announcement',
  SCHOLARSHIP_PUBLISHED: 'scholarship_published',
  SCHOLARSHIP_RESULT: 'scholarship_result',
});

export const SCHOLARSHIP_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

export const SCHOLARSHIP_TYPES = Object.freeze([
  'formation',
  'recherche',
  'stage',
  'autre',
]);

export const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  REJECTED: 'rejected',
});

export const PAYMENT_METHODS = Object.freeze({
  ALKHERPAY: 'alkherpay',
  ADMIN: 'admin',
});

export const QUIZ_DEFAULTS = Object.freeze({
  PASS_THRESHOLD: 60,
  MAX_ATTEMPTS: 3,
});