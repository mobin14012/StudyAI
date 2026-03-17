// Upload middleware configuration stub for Phase 2
// SECR-03: File upload limited by type (PDF/text only) and size (10MB max)
// This file defines the multer configuration but is NOT wired to any routes yet.
// It will be imported and applied in Phase 2 when upload routes are created.

// Configuration values for when multer is installed in Phase 2:
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
  allowedMimeTypes: [
    "application/pdf",
    "text/plain",
  ],
  allowedExtensions: [".pdf", ".txt"],
} as const;

// Usage in Phase 2:
// import multer from "multer";
// import { UPLOAD_CONFIG } from "./upload-config";
//
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: UPLOAD_CONFIG.maxFileSize },
//   fileFilter: (_req, file, cb) => {
//     if (UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype as any)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF and text files are allowed"));
//     }
//   },
// });
