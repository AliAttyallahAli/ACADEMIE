import multer from 'multer';
import { env } from '../config/env.js';

const memory = multer.memoryStorage();

export const uploadScholarshipDocs = multer({
  storage: memory,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format non autorisé (PDF, DOC, DOCX, JPG, PNG uniquement)'));
    }
    cb(null, true);
  },
});