import { ConceptState } from "../../services/concept.service";
import { StudentContextInput } from "../../services/generation/types";
import { gradeProfiles } from "./grade-profiles";
import {
  buildConceptContext,
  buildForgettingContext,
  buildMasteryLabelInstructions,
} from "./blocks";

export const PASSAGE_PROMPT_VERSION = "passage-v1";

export interface PassagePromptContext {
  subtopicName: string;
  topicId: string;
  subject: string;
  classLevel: 11 | 12;
  keyConceptsSummary: string;
  studentContext: StudentContextInput;
  conceptStates: ConceptState[];
  /** Chapter thread context (A5): what prior subtopics in this chapter covered. "" if none. */
  chapterThreadContext: string;
}

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: PassagePromptContext): string {
  const { studentContext } = ctx;
  const isRetry = studentContext.previousAttempts > 0;

  const retryBlock = isRetry
    ? `⚠️ RETRY ATTEMPT — MANDATORY DIFFERENT CONTENT ⚠️
Student has attempted this subtopic ${studentContext.previousAttempts} time(s).
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%.
Weak question types: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}.

YOU MUST generate a passage that:
1. Approaches the SAME subtopic from a completely different angle or application
2. Uses different Indian examples and scenarios than a standard first attempt
3. Focuses heavily on: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}
4. Does NOT repeat the standard textbook introduction
5. ${studentContext.lastScorePercentage >= 80 ? "Increases difficulty — student scored well" : studentContext.lastScorePercentage >= 60 ? "Slightly increases difficulty — student is progressing" : "Addresses specific misconceptions — student is struggling"}
${studentContext.wrongQuestions.length > 0 ? `6. Directly addresses: ${studentContext.wrongQuestions.map((q) => `"${q.chosenAnswer}" (wrong) vs "${q.correctAnswer}" (correct)`).join("; ")}` : ""}`
    : "";

  return `You are an expert Indian Chemistry teacher and JEE/NEET educator with 20 years of experience teaching NCERT Chemistry for Class 11 and 12.

Your job is to generate a focused reading passage on a SPECIFIC SUBTOPIC of a Chemistry chapter. Submit it by calling the submit_passage tool.

${retryBlock}

CRITICAL RULES:
1. The passage MUST be ONLY about the specific subtopic
2. The passage must be self-contained — every quiz question that follows will be answerable from the passage alone
3. Use Indian context throughout — Indian names, industries, examples
4. Content must be NCERT-aligned and JEE/NEET relevant`;
}

// ─── Student-history sub-blocks ──────────────────────────────────────────────

function buildPrereqMasteryContext(studentContext: StudentContextInput): string {
  if (studentContext.prerequisiteMasteries.length === 0) return "";

  return `PREREQUISITE CHAPTER MASTERY:
${studentContext.prerequisiteMasteries
  .map((p) => {
    const status =
      p.attempts === 0
        ? "NEVER ATTEMPTED"
        : p.mastery < 0.4
          ? `STRUGGLING (${Math.round(p.mastery * 100)}%)`
          : p.mastery < 0.6
            ? `DEVELOPING (${Math.round(p.mastery * 100)}%)`
            : `GOOD (${Math.round(p.mastery * 100)}%)`;
    return `  - ${p.name}: ${status}`;
  })
  .join("\n")}

${
  studentContext.prerequisiteGaps.length > 0
    ? `WEAK PREREQUISITES: Gaps in ${studentContext.prerequisiteGaps.join(", ")}. Weave in the core connecting concept naturally in the passage.`
    : "Prerequisites adequately mastered — go full depth."
}`;
}

function buildWrongQuestionsContext(studentContext: StudentContextInput, isRetry: boolean): string {
  if (!isRetry || studentContext.wrongQuestions.length === 0) return "";

  return `━━━ SPECIFIC MISCONCEPTIONS FROM LAST ATTEMPT ━━━
${studentContext.wrongQuestions
  .map(
    (q, i) => `MISCONCEPTION ${i + 1} [${q.cognitiveLevel}]:
Question: "${q.questionText}"
Student chose: "${q.chosenAnswer}"
Correct answer: "${q.correctAnswer}"
Why it matters: ${q.explanation}`,
  )
  .join("\n\n")}

MANDATORY: Passage must help the student not make these exact mistakes again.
`;
}

function buildRetryHistoryContext(studentContext: StudentContextInput): string {
  const isRetry = studentContext.previousAttempts > 0;
  const prereqMasteryContext = buildPrereqMasteryContext(studentContext);

  if (isRetry) {
    return `━━━ STUDENT LEARNING HISTORY ━━━
Previous attempts: ${studentContext.previousAttempts}
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%
Last attempt score: ${studentContext.lastScorePercentage}%
Struggling with: ${studentContext.weakCognitiveLevels.join(", ") || "none identified"}
${prereqMasteryContext}
${buildWrongQuestionsContext(studentContext, isRetry)}`;
  }

  return prereqMasteryContext
    ? `━━━ STUDENT KNOWLEDGE GRAPH STATE ━━━\n${prereqMasteryContext}`
    : "";
}

function buildPrereqReinforcement(studentContext: StudentContextInput, subtopicName: string): string {
  const weakestPrereq = studentContext.prerequisiteMasteries
    .filter((p) => p.attempts === 0 || p.mastery < 0.5)
    .sort((a, b) => a.mastery - b.mastery)[0];

  if (!weakestPrereq) return "";

  return `━━━ PREREQUISITE REINFORCEMENT — MANDATORY ━━━
Weakest prerequisite: "${weakestPrereq.name}" — ${weakestPrereq.attempts === 0 ? "NEVER ATTEMPTED" : `mastery ${Math.round(weakestPrereq.mastery * 100)}%`}

1. In the passage: weave in one sentence connecting "${weakestPrereq.name}" to ${subtopicName}.
2. One question must test this connection. Set its cognitiveLevel to "prerequisite_review" and conceptTag to the most relevant concept tag from the list above.
`;
}

// ─── User prompt ─────────────────────────────────────────────────────────────

function buildUserPrompt(ctx: PassagePromptContext): string {
  const { subtopicName, topicId, subject, classLevel, keyConceptsSummary, studentContext, conceptStates } = ctx;
  const profile = gradeProfiles[classLevel];
  const hasConceptData = conceptStates.length > 0;

  const conceptContext = hasConceptData ? buildConceptContext(conceptStates) : "";
  const forgettingContext = hasConceptData ? buildForgettingContext(conceptStates) : "";
  const masteryLabelInstructions = hasConceptData ? buildMasteryLabelInstructions(conceptStates) : "";
  const retryHistoryContext = buildRetryHistoryContext(studentContext);
  const prereqReinforcementInstruction = buildPrereqReinforcement(studentContext, subtopicName);

  const completedContext =
    studentContext.completedSubtopicsInChapter.length > 0
      ? `━━━ ALREADY COVERED IN THIS CHAPTER ━━━
The student has already completed these — do NOT re-explain:
${studentContext.completedSubtopicsInChapter.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`
      : "";

  return `Generate a reading passage for:

SUBTOPIC: ${subtopicName}
CHAPTER: ${topicId.replace(/_/g, " ")}
SUBJECT: ${subject}
CLASS: ${classLevel}
EXAM BOARD: NCERT (JEE/NEET relevant)

${retryHistoryContext}
${completedContext}
${ctx.chapterThreadContext}
${conceptContext}
${forgettingContext}
${masteryLabelInstructions}

━━━ WHAT THIS SUBTOPIC COVERS ━━━
Focus ONLY on: ${keyConceptsSummary}

━━━ CLASS ${classLevel} STUDENT PROFILE ━━━
Vocabulary: ${profile.vocabulary}
Sentence style: ${profile.sentenceStyle}
Analogy domain: ${profile.analogyDomain}
Tone: ${profile.tone}
Concept depth: ${profile.conceptDepth}
Prior knowledge: ${profile.priorKnowledge}
Context: ${profile.examContext}

━━━ PASSAGE REQUIREMENTS ━━━
- Length: strictly 220-260 words
- Structure:
  1. Hook (1-2 sentences): surprising fact or real phenomenon
  2. Core concept (3-4 sentences): main idea of THIS subtopic clearly explained
  3. Mechanism or detail (3-4 sentences): how/why it works at the appropriate depth
  4. Indian real-world connection (2 sentences): where this appears in Indian industry or daily life
  5. Bridge to next (1 sentence): how mastering this connects to the next concept
- Every example must be Indian
- Terminology must match NCERT Class ${classLevel} exactly
${prereqReinforcementInstruction}

Call submit_passage with the title (max 8 words) and the full passage text.`;
}

export function buildPassagePrompt(ctx: PassagePromptContext): { version: string; system: string; user: string } {
  return {
    version: PASSAGE_PROMPT_VERSION,
    system: buildSystemPrompt(ctx),
    user: buildUserPrompt(ctx),
  };
}
