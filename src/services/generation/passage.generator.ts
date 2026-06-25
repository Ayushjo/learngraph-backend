import { AppError } from "../../middleware/errorHandler";
import { callTool, MODELS } from "./anthropic.client";
import { GeneratedPassage } from "./types";
import passageTool from "../../config/tools/passage-generation.tool.json";

interface AssembledPrompt {
  system: string;
  user: string;
}

/**
 * Generate a passage via forced tool-use. Returns a structured {title, passage}
 * object — no markdown stripping or JSON.parse. Works for both normal and review
 * passages; the caller supplies the assembled prompt.
 */
export async function generatePassage(prompt: AssembledPrompt): Promise<GeneratedPassage> {
  const result = await callTool<GeneratedPassage>({
    model: MODELS.passage,
    maxTokens: 800,
    system: prompt.system,
    user: prompt.user,
    tool: passageTool,
  });

  if (!result.title || !result.passage) {
    throw new AppError(500, "Model returned an incomplete passage — please retry");
  }

  return result;
}
