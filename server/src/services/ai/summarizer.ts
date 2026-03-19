import {
  chatCompletion,
  estimateTokens,
  truncateForTokenBudget,
} from "./gemini-client";
import { AppError } from "../../middleware/error-handler";
import { logger } from "../../config/logger";

const SUMMARIZER_SYSTEM_PROMPT = `You are an expert academic summarizer. Create a clear, comprehensive summary of the study material provided.

Rules:
1. The summary should capture all key concepts and their relationships.
2. Use bullet points for main ideas and sub-bullets for supporting details.
3. Maintain academic accuracy — do not add information not present in the source.
4. Keep the summary between 200-800 words depending on material length.
5. Structure the summary with clear section headers if the material covers multiple topics.`;

const CHUNK_SUMMARIZER_SYSTEM_PROMPT = `You are an expert academic summarizer. Summarize the following section of study material concisely. Capture the key concepts and supporting details in 200-400 words.`;

const MERGE_SUMMARIZER_SYSTEM_PROMPT = `You are an expert academic summarizer. The following are summaries of different sections of the same study material. Merge them into a single coherent and comprehensive summary.

Rules:
1. Remove redundancy across sections.
2. Maintain logical flow and grouping.
3. Use bullet points for main ideas with sub-bullets for details.
4. Add section headers if the material covers multiple topics.
5. Keep the final summary between 300-800 words.`;

const TOKEN_THRESHOLD_SINGLE_PASS = 50000;
const CHUNK_SIZE_TOKENS = 30000;
const CHUNK_OVERLAP_TOKENS = 500;

/**
 * Generate a summary of study material using Gemini.
 * Uses single-pass for short documents, map-reduce for long documents.
 */
export async function generateSummary(text: string): Promise<string> {
  const tokenCount = estimateTokens(text);

  try {
    if (tokenCount <= TOKEN_THRESHOLD_SINGLE_PASS) {
      return await singlePassSummary(text);
    } else {
      return await chunkedSummary(text);
    }
  } catch (error: any) {
    logger.error("Summarization failed:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Unable to generate summary. Please try again.",
      500,
      "SUMMARY_GENERATION_FAILED"
    );
  }
}

async function singlePassSummary(text: string): Promise<string> {
  const truncated = truncateForTokenBudget(text, 60000);

  return chatCompletion({
    systemPrompt: SUMMARIZER_SYSTEM_PROMPT,
    userPrompt: `Summarize the following study material:\n\n${truncated}`,
    maxTokens: 2000,
    temperature: 0.4,
  });
}

async function chunkedSummary(text: string): Promise<string> {
  // Split text into chunks
  const chunks = splitIntoChunks(text, CHUNK_SIZE_TOKENS, CHUNK_OVERLAP_TOKENS);

  // Summarize each chunk independently
  const chunkSummaries = await Promise.all(
    chunks.map((chunk) =>
      chatCompletion({
        systemPrompt: CHUNK_SUMMARIZER_SYSTEM_PROMPT,
        userPrompt: `Summarize this section:\n\n${chunk}`,
        maxTokens: 1000,
        temperature: 0.4,
      })
    )
  );

  // Merge chunk summaries into a unified summary
  const combined = chunkSummaries.join("\n\n---\n\n");

  return chatCompletion({
    systemPrompt: MERGE_SUMMARIZER_SYSTEM_PROMPT,
    userPrompt: `Merge these section summaries into a unified summary:\n\n${combined}`,
    maxTokens: 2000,
    temperature: 0.4,
  });
}

/**
 * Split text into chunks of approximately `chunkTokens` size
 * with `overlapTokens` overlap between chunks.
 * Splits on paragraph boundaries when possible.
 */
function splitIntoChunks(
  text: string,
  chunkTokens: number,
  overlapTokens: number
): string[] {
  const chunkChars = chunkTokens * 4;
  const overlapChars = overlapTokens * 4;
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkChars, text.length);

    // Try to split on paragraph boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + chunkChars * 0.5) {
        end = paragraphBreak;
      } else {
        // Fallback: split on sentence boundary
        const sentenceBreak = text.lastIndexOf(". ", end);
        if (sentenceBreak > start + chunkChars * 0.5) {
          end = sentenceBreak + 1;
        }
      }
    }

    chunks.push(text.slice(start, end));
    start = end - overlapChars;

    // Avoid infinite loop if overlap pushes start back
    if (chunks.length > 1 && start <= end - chunkChars) {
      start = end;
    }
  }

  return chunks;
}
