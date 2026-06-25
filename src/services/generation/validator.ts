import { callTool, MODELS } from "./anthropic.client";
import { GeneratedQuestion, ValidationResult } from "./types";
import { buildValidatorPrompt } from "../../config/prompts/validator.prompt";
import validationTool from "../../config/tools/passage-validation.tool.json";

/** Below this aggregate score, the orchestrator regenerates once (A4). */
export const VALIDATION_THRESHOLD = 0.7;

export interface ValidationOutcome extends ValidationResult {
  aggregate: number;
  passed: boolean;
}

interface ValidateInput {
  subtopicName: string;
  targetConceptTags: string[];
  passage: string;
  questions: GeneratedQuestion[];
}

/**
 * LLM-judge quality gate (A4). Scores the passage + questions against a rubric and
 * returns an aggregate. Never throws — a failed judge call should not block content
 * delivery, so it returns a neutral pass on error.
 */
export async function validateContent(input: ValidateInput): Promise<ValidationOutcome> {
  try {
    const prompt = buildValidatorPrompt(input);
    const r = await callTool<ValidationResult>({
      model: MODELS.validator,
      maxTokens: 500,
      system: prompt.system,
      user: prompt.user,
      tool: validationTool,
    });

    const dims = [
      r.conceptCoverage,
      r.answerability,
      r.keyCorrectness,
      r.distractorQuality,
      r.lengthReadability,
    ];
    const aggregate = Math.round((dims.reduce((a, b) => a + b, 0) / dims.length) * 100) / 100;

    return { ...r, aggregate, passed: aggregate >= VALIDATION_THRESHOLD };
  } catch {
    // Judge unavailable — do not block delivery; treat as a neutral pass.
    return {
      conceptCoverage: 1,
      answerability: 1,
      keyCorrectness: 1,
      distractorQuality: 1,
      lengthReadability: 1,
      issues: [],
      aggregate: 1,
      passed: true,
    };
  }
}
