import pdf from "pdf-parse";
import { AppError } from "../middleware/error-handler";

const MIN_EXTRACTED_TEXT_LENGTH = 50;

/**
 * Validate that a buffer starts with the PDF magic bytes (%PDF).
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

/**
 * Extract text content from a PDF buffer.
 * Throws AppError for corrupted, password-protected, or scanned/image PDFs.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!isPdfBuffer(buffer)) {
    throw new AppError(
      "File does not appear to be a valid PDF.",
      400,
      "INVALID_PDF"
    );
  }

  try {
    const data = await pdf(buffer);
    const text = data.text.trim();

    if (text.length < MIN_EXTRACTED_TEXT_LENGTH) {
      throw new AppError(
        "This PDF appears to be scanned/image-based. Please upload a text-based PDF or paste the content as plain text.",
        422,
        "PDF_NO_TEXT"
      );
    }

    return text;
  } catch (error: any) {
    // Re-throw our own AppErrors
    if (error instanceof AppError) {
      throw error;
    }

    // Detect password-protected PDFs
    if (
      error.message?.includes("password") ||
      error.message?.includes("encrypted")
    ) {
      throw new AppError(
        "This PDF is password-protected. Please remove the password and try again.",
        422,
        "PDF_PASSWORD_PROTECTED"
      );
    }

    // Generic parse failure
    throw new AppError(
      "Unable to extract text from this PDF. The file may be corrupted.",
      422,
      "PDF_PARSE_FAILED"
    );
  }
}
