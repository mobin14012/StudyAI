import { geminiModel } from "../config/gemini";
import { Material } from "../models/Material";
import { AppError } from "../middleware/error-handler";
import { logger } from "../config/logger";
import type { ChatMessageInput } from "../schemas/tutor.schemas";

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

  // Build conversation history for Gemini
  const conversationHistory = history
    .map((h) => `${h.role === "user" ? "Student" : "Tutor"}: ${h.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}

${conversationHistory ? `CONVERSATION SO FAR:\n${conversationHistory}\n\n` : ""}Student: ${message}

Tutor:`;

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const response = result.response;
    const assistantMessage = response.text() || "I'm sorry, I couldn't generate a response.";

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
