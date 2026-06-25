import { GeneratedQuestion } from "../../services/generation/types";

export const SUMMARY_PROMPT_VERSION = "summary-v1";

export interface SummaryPromptContext {
  subtopicName: string;
  attemptNumber: number;
  passage: string;
  questions: GeneratedQuestion[];
}

const SYSTEM_PROMPT = `You compress a freshly generated Chemistry passage and its questions into a
compact coverage summary. This summary is fed into future generations in the same chapter so
the model does not repeat examples or concepts. Be specific and terse. Submit by calling the
submit_coverage_summary tool.`;

function buildUserPrompt(ctx: SummaryPromptContext): string {
  const { subtopicName, attemptNumber, passage, questions } = ctx;
  const questionLines = questions
    .map((q) => `[${q.cognitiveLevel}] tag=${q.conceptTag} diff=${q.difficulty}`)
    .join("\n");

  return `Summarize this generation.

SUBTOPIC: ${subtopicName}
ATTEMPT: ${attemptNumber}

━━━ PASSAGE ━━━
${passage}

━━━ QUESTIONS (cognitive level / concept tag / difficulty) ━━━
${questionLines}

Call submit_coverage_summary with:
- examplesUsed: the concrete Indian examples/scenarios the passage used
- conceptsCovered: the key concepts the passage actually taught
- approachAngle: one sentence on the framing used, so a retry can pick a different one
- questionAngles: a brief note on what the questions tested`;
}

export function buildSummaryPrompt(ctx: SummaryPromptContext): { version: string; system: string; user: string } {
  return {
    version: SUMMARY_PROMPT_VERSION,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(ctx),
  };
}
