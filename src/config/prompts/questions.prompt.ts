import { ConceptState } from "../../services/concept.service";
import { QuestionSlot } from "../../services/generation/types";
import { buildConceptContext, buildMasteryLabelInstructions, buildAllocationTable } from "./blocks";

export const QUESTIONS_PROMPT_VERSION = "questions-v1";

export interface QuestionsPromptContext {
  passage: string;
  subtopicName: string;
  classLevel: 11 | 12;
  allocation: QuestionSlot[];
  conceptStates: ConceptState[];
}

const SYSTEM_PROMPT = `You are an expert Indian Chemistry teacher and JEE/NEET educator.
Your job is to generate exactly 8 quiz questions for a given reading passage.
All questions must be answerable from the passage alone.
Submit them by calling the submit_questions tool with exactly 8 questions.`;

function buildUserPrompt(ctx: QuestionsPromptContext): string {
  const { passage, subtopicName, classLevel, allocation, conceptStates } = ctx;
  const hasConceptData = conceptStates.length > 0;

  const conceptContext = hasConceptData ? buildConceptContext(conceptStates) : "";
  const masteryLabelInstructions = hasConceptData ? buildMasteryLabelInstructions(conceptStates) : "";
  const allocationTable = hasConceptData ? buildAllocationTable(allocation) : "";

  return `Generate 8 quiz questions for this passage:

SUBTOPIC: ${subtopicName}
CLASS: ${classLevel}
EXAM BOARD: NCERT (JEE/NEET relevant)

━━━ PASSAGE ━━━
${passage}

${conceptContext}
${masteryLabelInstructions}

${allocationTable}

Each question must have 4 options (prefixed "A. ", "B. ", "C. ", "D. "), one unambiguous
correct answer, three plausible distractors reflecting common JEE/NEET misconceptions, and
an explanation referencing the exact passage line. The conceptTag must exactly match one of
the tags from the CONCEPT MASTERY STATE above.

Call submit_questions with all 8 questions.`;
}

export function buildQuestionsPrompt(ctx: QuestionsPromptContext): { version: string; system: string; user: string } {
  return {
    version: QUESTIONS_PROMPT_VERSION,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(ctx),
  };
}
