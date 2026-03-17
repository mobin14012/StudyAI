import multer, { MulterError } from "multer";
import { Request, Response, NextFunction } from "express";
import { UPLOAD_CONFIG } from "./upload-config";
import { AppError } from "./error-handler";

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only PDF and plain text files are allowed.`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
}

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_CONFIG.maxFileSize },
  fileFilter,
});

export const uploadSingle = upload.single("file");

/**
 * Middleware to convert MulterError instances into AppError
 * so the global error handler formats them consistently.
 */
export function handleMulterError(
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        new AppError(
          "File too large. Maximum size is 10MB.",
          413,
          "FILE_TOO_LARGE"
        )
      );
      return;
    }
    next(
      new AppError(`Upload error: ${err.message}`, 400, "UPLOAD_ERROR")
    );
    return;
  }
  next(err);
}
