import multer from 'multer';
import { env } from '../config/env.js';

const memory = multer.memoryStorage();

export const uploadPhoto = multer({
  storage: memory,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  },
});

export const uploadDocument = multer({
  storage: memory,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});