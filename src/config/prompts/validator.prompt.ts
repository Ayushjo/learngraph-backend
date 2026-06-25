import { GeneratedQuestion } from "../../services/generation/types";

export const VALIDATOR_PROMPT_VERSION = "validator-v1";

export interface ValidatorPromptContext {
  subtopicName: string;
  targetConceptTags: string[];
  passage: string;
  questions: GeneratedQuestion[];
}

const SYSTEM_PROMPT = `You are a strict Chemistry assessment reviewer. You audit a generated passage and
its 8 multiple-choice questions for quality before they reach a student. Be critical — a passable
score is reserved for content with no factual or pedagogical defects. Submit your assessment by
calling the submit_validation tool.`;

function buildUserPrompt(ctx: ValidatorPromptContext): string {
  const { subtopicName, targetConceptTags, passage, questions } = ctx;

  const questionBlock = questions
    .map((q) => {
      const opts = q.options.map((o, i) => `    ${i === q.correctIndex ? "✓" : " "} ${o}`).join("\n");
      return `Q${q.index + 1} [${q.cognitiveLevel}, tag=${q.conceptTag}]: ${q.question}
${opts}
    explanation: ${q.explanation}`;
    })
    .join("\n\n");

  return `Audit this passage and its questions.

SUBTOPIC: ${subtopicName}
TARGET CONCEPTS (must all be taught by the passage): ${targetConceptTags.join(", ")}

━━━ PASSAGE ━━━
${passage}

━━━ QUESTIONS (✓ marks the claimed-correct option) ━━━
${questionBlock}

Score each dimension from 0.0 to 1.0 and call submit_validation:
- conceptCoverage: does the passage actually teach every target concept?
- answerability: is each question answerable from the passage alone?
- keyCorrectness: is every ✓ option actually correct and every distractor actually wrong?
- distractorQuality: are distractors plausible misconceptions, not throwaways?
- lengthReadability: is the passage ~220-260 words at the right grade level?
List any concrete problems in issues (empty array if clean).`;
}

export function buildValidatorPrompt(ctx: ValidatorPromptContext): { version: string; system: string; user: string } {
  return {
    version: VALIDATOR_PROMPT_VERSION,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(ctx),
  };
}
