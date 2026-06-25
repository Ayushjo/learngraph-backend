import { callTool, MODELS } from "./anthropic.client";
import { CoverageSummary, GeneratedQuestion } from "./types";
import { buildSummaryPrompt } from "../../config/prompts/summary.prompt";
import summaryTool from "../../config/tools/coverage-summary.tool.json";

interface SummarizeInput {
  subtopicName: string;
  attemptNumber: number;
  passage: string;
  questions: GeneratedQuestion[];
}

/**
 * Produce a compact, storable coverage summary for chapter thread context (A5).
 * Returns "" on any failure — this is non-critical metadata and must never break
 * the main generation path.
 */
export async function generateCoverageSummary(input: SummarizeInput): Promise<string> {
  try {
    const prompt = buildSummaryPrompt(input);
    const s = await callTool<CoverageSummary>({
      model: MODELS.summary,
      maxTokens: 300,
      system: prompt.system,
      user: prompt.user,
      tool: summaryTool,
    });

    return [
      `Subtopic: ${input.subtopicName} | Attempt: ${input.attemptNumber}`,
      `Examples used: ${s.examplesUsed.join(", ")}`,
      `Concepts covered: ${s.conceptsCovered.join(", ")}`,
      `Approach: ${s.approachAngle}`,
      `Questions: ${s.questionAngles}`,
    ].join("\n");
  } catch {
    return "";
  }
}
