import OpenAI from "openai";
import { env } from "../config/env";
import { Material } from "../models/Material";
import { AppError } from "../middleware/error-handler";
import { logger } from "../config/logger";
import type { ChatMessageInput } from "../schemas/tutor.schemas";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: string;
  history: ChatMessage[];
}

// Truncate text to fit in context window
function truncateForContext(text: string, maxChars: number = 8000): string {
  if (text.length <= maxChars) return text;
  const headSize = Math.floor(maxChars * 0.8);
  const tailSize = maxChars - headSize;
  return text.slice(0, headSize) + "\n\n[...content truncated...]\n\n" + text.slice(-tailSize);
}

/**
 * Chat with AI tutor grounded in user's material.
 */
export async function chatWithTutor(
  input: ChatMessageInput,
  userId: string
): Promise<ChatResponse> {
  const { materialId, message, history } = input;

  // Get material for context
  const material = await Material.findOne({
    _id: materialId,
    userId,
    status: "ready",
  }).select("filename extractedText topics");

  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  const contextText = truncateForContext(material.extractedText);
  const topicNames = material.topics
    .filter((t) => t.selected)
    .map((t) => t.name)
    .join(", ");

  const systemPrompt = `You are a helpful study tutor. You are helping a student understand their study material.

MATERIAL TITLE: ${material.filename}
TOPICS: ${topicNames}

MATERIAL CONTENT:
${contextText}

INSTRUCTIONS:
- Answer questions ONLY based on the material content provided above
- If the student asks about something not covered in the material, say "I don't see information about that in your study material. Try asking about one of these topics: ${topicNames}"
- Be encouraging and supportive
- Use clear, simple explanations
- If the student seems confused, offer to break down concepts further
- Keep responses concise but thorough`;

  // Build messages array
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    logger.info(`Tutor chat completed for material ${materialId}`);

    return {
      message: assistantMessage,
      history: [
        ...history,
        { role: "user", content: message },
        { role: "assistant", content: assistantMessage },
      ],
    };
  } catch (error) {
    logger.error("Tutor chat error:", error);
    throw new AppError("Failed to generate response", 500, "TUTOR_ERROR");
  }
}
