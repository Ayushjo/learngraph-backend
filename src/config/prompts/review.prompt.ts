import { ConceptState } from "../../services/concept.service";
import { QuestionSlot } from "../../services/generation/types";
import { gradeProfiles } from "./grade-profiles";
import {
  buildConceptContext,
  buildForgettingContext,
  buildMasteryLabelInstructions,
  buildAllocationTable,
} from "./blocks";

export const REVIEW_PROMPT_VERSION = "review-v1";

export interface ReviewPromptContext {
  subtopicName: string;
  topicId: string;
  classLevel: 11 | 12;
  keyConceptsSummary: string;
  dueConceptStates: ConceptState[];
  allocation: QuestionSlot[];
}

const SYSTEM_PROMPT = `You are an expert Indian Chemistry teacher and JEE/NEET educator with 20 years of experience.

Your job is to generate a SPACED REPETITION REVIEW passage. Submit it by calling the submit_passage tool.

This is a REVIEW session — the student has previously studied these concepts but memory is fading.
Your passage must REACTIVATE faded memories, not teach from scratch.
Connect concepts to real Indian examples they may remember.

CRITICAL RULES:
1. Passage MUST cover all listed FORGETTING ALERT concepts prominently
2. The passage must be self-contained — every quiz question that follows will be answerable from it alone
3. Use Indian context throughout
4. Content must be NCERT-aligned and JEE/NEET relevant`;

function buildUserPrompt(ctx: ReviewPromptContext): string {
  const { subtopicName, topicId, classLevel, keyConceptsSummary, dueConceptStates, allocation } = ctx;
  const profile = gradeProfiles[classLevel];

  const conceptContext = buildConceptContext(dueConceptStates);
  const forgettingContext = buildForgettingContext(dueConceptStates);
  const masteryLabelInstructions = buildMasteryLabelInstructions(dueConceptStates);
  const allocationTable = buildAllocationTable(allocation.filter((s) => !s.isBackup));

  return `Generate a spaced-repetition review passage.

PRIMARY SUBTOPIC: ${subtopicName}
CHAPTER: ${topicId.replace(/_/g, " ")}
CLASS: ${classLevel}
EXAM BOARD: NCERT (JEE/NEET relevant)

${conceptContext}
${forgettingContext}
${masteryLabelInstructions}

━━━ SUBTOPIC FOCUS ━━━
Core concepts: ${keyConceptsSummary}

━━━ CLASS ${classLevel} STUDENT PROFILE ━━━
Vocabulary: ${profile.vocabulary}
Tone: ${profile.tone}
Context: ${profile.examContext}

━━━ REVIEW PASSAGE REQUIREMENTS ━━━
- Length: strictly 200-250 words
- This is a REVIEW — build on prior knowledge, don't introduce from scratch
- Open with a memory hook ("Remember how...", "You've seen that...", "Recall that...")
- Reinforce every concept listed in FORGETTING ALERT
- 2-3 vivid Indian examples to anchor the memory
- End with a bridge connecting these concepts to a related topic

${allocationTable}

Call submit_passage with the title (max 8 words) and the full passage text.`;
}

export function buildReviewPrompt(ctx: ReviewPromptContext): { version: string; system: string; user: string } {
  return {
    version: REVIEW_PROMPT_VERSION,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(ctx),
  };
}
