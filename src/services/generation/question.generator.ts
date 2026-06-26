import { AppError } from "../../middleware/errorHandler";
import { callTool, MODELS } from "./anthropic.client";
import { GeneratedQuestion } from "./types";
import questionTool from "../../config/tools/question-generation.tool.json";

interface AssembledPrompt {
  system: string;
  user: string;
}

/**
 * Generate exactly 8 questions via forced tool-use. The tool schema enforces the
 * shape (8 items, 4 options, required fields); these checks are a defensive net.
 */
export async function generateQuestions(prompt: AssembledPrompt): Promise<GeneratedQuestion[]> {
  const result = await callTool<{ questions: GeneratedQuestion[] }>({
    model: MODELS.questions,
    maxTokens: 2000,
    system: prompt.system,
    user: prompt.user,
    tool: questionTool,
  });

  const questions = result.questions;
  if (!Array.isArray(questions) || questions.length !== 8) {
    throw new AppError(500, "Model returned the wrong number of questions — please retry");
  }

  const missingFields = questions.some(
    (q) => typeof q.conceptTag !== "string" || q.conceptTag.length === 0 || typeof q.difficulty !== "number",
  );
  if (missingFields) {
    throw new AppError(500, "Model returned questions without required fields — please retry");
  }

  return questions;
}
