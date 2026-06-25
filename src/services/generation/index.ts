import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/errorHandler";
import { getSubtopicById, SubtopicDefinition } from "../../data/subtopics";
import { ConceptState } from "../concept.service";
import { passageBankService } from "../passage.bank.service";
import { questionBankService } from "../question.bank.service";

import { buildQuestionAllocation } from "../../config/prompts/blocks";
import { buildPassagePrompt } from "../../config/prompts/passage.prompt";
import { buildQuestionsPrompt } from "../../config/prompts/questions.prompt";
import { buildReviewPrompt } from "../../config/prompts/review.prompt";

import { generatePassage } from "./passage.generator";
import { generateQuestions } from "./question.generator";
import { generateCoverageSummary } from "./summarizer";
import { validateContent, ValidationOutcome } from "./validator";
import { buildChapterThreadContext } from "./context.builder";
import {
  persistGeneratedContent,
  findRecentActiveSession,
  createGeneratedSession,
  attachGenerationSummary,
  recordPassageValidation,
  buildSessionPool,
} from "./persister";

import {
  GeneratedPassage,
  GeneratedQuestion,
  GenerationResult,
  PoolQuestion,
  ReviewGenerationResult,
  StudentContextInput,
  SubtopicSummary,
} from "./types";

// ─── Small helpers ───────────────────────────────────────────────────────────

function toSubtopicSummary(def: SubtopicDefinition): SubtopicSummary {
  return {
    id: def.id,
    name: def.name,
    order: def.order,
    topicId: def.topicId,
    classLevel: def.classLevel,
    subject: def.subject,
  };
}

function conceptTagsOf(conceptStates: ConceptState[], subtopicId: string): string[] {
  const tags = [...new Set(conceptStates.map((c) => c.tag))];
  return tags.length > 0 ? tags : [`${subtopicId}_general`];
}

/** Fire-and-forget coverage summary so every session feeds the chapter thread (A5). */
function fireCoverageSummary(
  sessionId: string,
  subtopicName: string,
  attemptNumber: number,
  passage: string,
  questions: GeneratedQuestion[],
): void {
  generateCoverageSummary({ subtopicName, attemptNumber, passage, questions })
    .then((summary) => attachGenerationSummary(sessionId, summary).catch(() => {}))
    .catch(() => {});
}

interface ValidateInput {
  subtopicName: string;
  targetConceptTags: string[];
  passage: string;
  questions: GeneratedQuestion[];
}

/** Validate a passage and record the score without blocking — used by the live path. */
function fireValidation(passageId: string, input: ValidateInput): void {
  validateContent(input)
    .then((outcome) => recordPassageValidation(passageId, outcome).catch(() => {}))
    .catch(() => {});
}

interface GeneratedContent {
  passage: GeneratedPassage;
  questions: GeneratedQuestion[];
  /** Present only for background generation; null on the live path (validated async). */
  validation: ValidationOutcome | null;
}

/**
 * Generate passage + questions and validate (A4).
 *
 * Live request (onPassageReady provided): stream the passage immediately for
 * perceived speed, then generate + validate. We store the score but do NOT
 * regenerate, because a viewer is already reading the streamed passage.
 *
 * Background request (no callback — preemptive / review): generate, validate, and
 * regenerate once if quality is below threshold, keeping the better attempt.
 */
async function generateValidatedContent(
  passagePrompt: { system: string; user: string },
  buildQuestionsFor: (passage: string) => { system: string; user: string },
  subtopicName: string,
  targetConceptTags: string[],
  onPassageReady?: (title: string, passage: string) => void,
): Promise<GeneratedContent> {
  const attempt = async () => {
    const passage = await generatePassage(passagePrompt);
    const questions = await generateQuestions(buildQuestionsFor(passage.passage));
    const validation = await validateContent({
      subtopicName,
      targetConceptTags,
      passage: passage.passage,
      questions,
    });
    return { passage, questions, validation };
  };

  if (onPassageReady) {
    // Live path: stream the passage immediately, then generate questions. Validation
    // happens asynchronously after persist (see caller) so it never adds latency to
    // the questions the student is waiting on.
    const passage = await generatePassage(passagePrompt);
    onPassageReady(passage.title, passage.passage);
    const questions = await generateQuestions(buildQuestionsFor(passage.passage));
    return { passage, questions, validation: null };
  }

  const first = await attempt();
  if (first.validation.passed) return first;
  const second = await attempt();
  return second.validation.aggregate >= first.validation.aggregate ? second : first;
}

// ─── Bank fast-path (non-retry only) ─────────────────────────────────────────

async function tryBankPath(
  studentId: string,
  subtopicDef: SubtopicDefinition,
  conceptStates: ConceptState[],
  hasConceptData: boolean,
  allocation: ReturnType<typeof buildQuestionAllocation>,
): Promise<GenerationResult | null> {
  const { id: subtopicId, classLevel, subject, name: subtopicName, topicId } = subtopicDef;

  const passage = await passageBankService.findMatchingPassage(
    studentId,
    subtopicId,
    topicId,
    subject,
    classLevel,
  );
  if (!passage) return null;

  // Best case: reuse a banked passage AND assemble its questions from the bank.
  if (hasConceptData) {
    const assembledPool = await questionBankService.assembleQuestionPool(studentId, subtopicId, allocation);
    if (assembledPool) {
      const poolQuestions: PoolQuestion[] = assembledPool.map((q) => ({
        index: q.index,
        cognitiveLevel: q.cognitiveLevel,
        conceptTag: q.conceptTag,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options as string[],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        bankQuestionId: q.id,
      }));

      await passageBankService.recordPassageSeen(studentId, passage.id);
      await Promise.all(assembledPool.map((q) => questionBankService.recordQuestionSeen(studentId, q.id)));

      const session = await createGeneratedSession({
        studentId,
        subtopicId,
        topicId,
        classLevel,
        passage: passage.passage,
        poolQuestions,
      });

      fireCoverageSummary(session.id, subtopicName, 1, passage.passage, poolQuestions);

      return {
        sessionId: session.id,
        title: passage.title,
        passage: passage.passage,
        questions: poolQuestions.slice(0, 5),
        subtopic: toSubtopicSummary(subtopicDef),
        source: "bank",
      };
    }
  }

  // Banked passage exists but we couldn't assemble questions — generate them for it.
  const generatedQuestions = await generateQuestions(
    buildQuestionsPrompt({
      passage: passage.passage,
      subtopicName,
      classLevel: classLevel as 11 | 12,
      allocation,
      conceptStates,
    }),
  );

  const storedIds = await passageBankService.storeQuestionsForPassage(passage.id, subtopicId, generatedQuestions);
  const bankIdMap = new Map(storedIds.map((id, i) => [i, id]));
  const poolQuestions = buildSessionPool(generatedQuestions, bankIdMap);

  await passageBankService.recordPassageSeen(studentId, passage.id);
  await Promise.all(storedIds.map((id) => questionBankService.recordQuestionSeen(studentId, id)));

  const session = await createGeneratedSession({
    studentId,
    subtopicId,
    topicId,
    classLevel,
    passage: passage.passage,
    poolQuestions,
  });

  fireCoverageSummary(session.id, subtopicName, 1, passage.passage, generatedQuestions);

  return {
    sessionId: session.id,
    title: passage.title,
    passage: passage.passage,
    questions: poolQuestions.slice(0, 5),
    subtopic: toSubtopicSummary(subtopicDef),
    source: "bank",
  };
}

// ─── Public service ──────────────────────────────────────────────────────────

export const contentService = {
  async generatePassageAndQuestions(
    studentId: string,
    subtopicId: string,
    studentContext: StudentContextInput,
    onPassageReady?: (title: string, passage: string) => void,
  ): Promise<GenerationResult> {
    const subtopicDef = getSubtopicById(subtopicId);
    if (!subtopicDef) throw new AppError(404, `Subtopic ${subtopicId} not found`);

    const { classLevel, subject, name: subtopicName, keyConceptsSummary, topicId } = subtopicDef;
    if (classLevel !== 11 && classLevel !== 12) {
      throw new AppError(400, "Only Class 11 and 12 supported");
    }

    const isRetry = studentContext.previousAttempts > 0;
    const conceptStates = studentContext.conceptStates ?? [];
    const allocation = buildQuestionAllocation(conceptStates);
    const hasConceptData = allocation.length > 0;

    // Bank fast-path — only for first attempts (retries must produce fresh content).
    if (!isRetry) {
      const bankResult = await tryBankPath(studentId, subtopicDef, conceptStates, hasConceptData, allocation);
      if (bankResult) return bankResult;
    }

    // ── Generated path ────────────────────────────────────────────────────────
    const chapterThreadContext = await buildChapterThreadContext(studentId, topicId, subtopicId);

    const passagePrompt = buildPassagePrompt({
      subtopicName,
      topicId,
      subject,
      classLevel,
      keyConceptsSummary,
      studentContext,
      conceptStates,
      chapterThreadContext,
    });

    const buildQuestionsFor = (passage: string) =>
      buildQuestionsPrompt({
        passage,
        subtopicName,
        classLevel: classLevel as 11 | 12,
        allocation,
        conceptStates,
      });

    const targetConceptTags = conceptTagsOf(conceptStates, subtopicId);

    const { passage, questions, validation } = await generateValidatedContent(
      passagePrompt,
      buildQuestionsFor,
      subtopicName,
      targetConceptTags,
      onPassageReady,
    );

    const { passageId, poolQuestions } = await persistGeneratedContent({
      studentId,
      subtopicId,
      topicId,
      subject,
      classLevel,
      title: passage.title,
      passage: passage.passage,
      questions,
      validation: validation ?? undefined,
    });

    // Live path returned no validation (to avoid latency) — validate asynchronously.
    if (!validation) {
      fireValidation(passageId, { subtopicName, targetConceptTags, passage: passage.passage, questions });
    }

    // A preemptive session may already exist — reuse it rather than duplicate.
    const recent = await findRecentActiveSession(studentId, subtopicId);
    if (recent) {
      const existingPool = recent.questionPool as unknown as PoolQuestion[];
      return {
        sessionId: recent.id,
        title: passage.title,
        passage: recent.passage,
        questions: existingPool.slice(0, 5),
        subtopic: toSubtopicSummary(subtopicDef),
        source: "generated",
      };
    }

    const session = await createGeneratedSession({
      studentId,
      subtopicId,
      topicId,
      classLevel,
      passage: passage.passage,
      poolQuestions,
      promptVersion: passagePrompt.version,
    });

    fireCoverageSummary(session.id, subtopicName, studentContext.previousAttempts + 1, passage.passage, questions);

    return {
      sessionId: session.id,
      title: passage.title,
      passage: passage.passage,
      questions: poolQuestions.slice(0, 5),
      subtopic: toSubtopicSummary(subtopicDef),
      source: "generated",
    };
  },

  async getSession(sessionId: string, studentId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { subtopic: true },
    });
    if (!session) throw new AppError(404, "Session not found");
    return session;
  },

  /**
   * Phase 1 — generate a cross-concept spaced-repetition review session.
   * Picks the subtopic owning the most due concepts, generates a review passage
   * anchored there, then allocates questions across all due concepts.
   */
  async generateReviewSession(
    studentId: string,
    dueConceptStates: ConceptState[],
  ): Promise<ReviewGenerationResult> {
    if (dueConceptStates.length === 0) {
      throw new AppError(400, "No due concepts provided for review session");
    }

    const conceptRows = await prisma.concept.findMany({
      where: { id: { in: dueConceptStates.map((c) => c.conceptId) } },
      select: { id: true, subtopicId: true },
    });

    const subtopicCount: Record<string, number> = {};
    for (const row of conceptRows) {
      subtopicCount[row.subtopicId] = (subtopicCount[row.subtopicId] ?? 0) + 1;
    }
    const primarySubtopicId = Object.entries(subtopicCount).sort(([, a], [, b]) => b - a)[0][0];

    const subtopicDef = getSubtopicById(primarySubtopicId);
    if (!subtopicDef) throw new AppError(404, `Primary subtopic ${primarySubtopicId} not found`);

    const { classLevel, name: subtopicName, keyConceptsSummary, topicId } = subtopicDef;
    if (classLevel !== 11 && classLevel !== 12) {
      throw new AppError(400, "Only Class 11 and 12 supported");
    }

    const allocation = buildQuestionAllocation(dueConceptStates);

    const passagePrompt = buildReviewPrompt({
      subtopicName,
      topicId,
      classLevel: classLevel as 11 | 12,
      keyConceptsSummary,
      dueConceptStates,
      allocation,
    });

    const buildQuestionsFor = (passage: string) =>
      buildQuestionsPrompt({
        passage,
        subtopicName,
        classLevel: classLevel as 11 | 12,
        allocation,
        conceptStates: dueConceptStates,
      });

    // Review runs in the background (no live passage stream) — allow regeneration.
    const { passage, questions, validation } = await generateValidatedContent(
      passagePrompt,
      buildQuestionsFor,
      subtopicName,
      conceptTagsOf(dueConceptStates, primarySubtopicId),
    );

    const { poolQuestions } = await persistGeneratedContent({
      studentId,
      subtopicId: primarySubtopicId,
      topicId,
      subject: subtopicDef.subject,
      classLevel,
      title: passage.title,
      passage: passage.passage,
      questions,
      validation: validation ?? undefined,
    });

    const session = await createGeneratedSession({
      studentId,
      subtopicId: primarySubtopicId,
      topicId,
      classLevel,
      passage: passage.passage,
      poolQuestions,
      promptVersion: passagePrompt.version,
    });

    fireCoverageSummary(session.id, subtopicName, 1, passage.passage, questions);

    return {
      sessionId: session.id,
      title: passage.title,
      passage: passage.passage,
      questions: poolQuestions.slice(0, 5),
      subtopicId: primarySubtopicId,
      reviewedConceptCount: dueConceptStates.length,
      source: "generated",
    };
  },
};
