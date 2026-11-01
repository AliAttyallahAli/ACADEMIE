import dotenv from 'dotenv';
dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`❌ Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const env = Object.freeze({
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 4000)),
  baseUrl: required('BASE_URL', 'http://localhost:4000'),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),
  certSecret: required('CERT_SECRET'),

  dbPath: required('DB_PATH', './alkher.db'),

  alkherpayApiKey: process.env.ALKHERPAY_API_KEY || '',
  alkherpayWebhookSecret: process.env.ALKHERPAY_WEBHOOK_SECRET || '',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'ALKHER ACADEMY <no-reply@alkher-academy.com>',
  },

  uploadDir: required('UPLOAD_DIR', './uploads'),
  maxUploadMb: Number(required('MAX_UPLOAD_MB', 5)),
});