import multer from 'multer';

import { AppError } from '../utils/app-error';

export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

// Kept in memory: files are small and parsed right away, never written to disk
export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isCsvName = /\.(csv|txt)$/i.test(file.originalname);

    if (!isCsvName || !ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError('Envie um arquivo no formato CSV', 400));
      return;
    }

    callback(null, true);
  },
});
