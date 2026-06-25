import { prisma } from "../../db/prisma";
import { passageBankService } from "../passage.bank.service";
import { questionBankService } from "../question.bank.service";
import { GeneratedQuestion, PoolQuestion } from "./types";
import { ValidationOutcome } from "./validator";

function buildSessionPool(
  questions: GeneratedQuestion[],
  bankQuestionIds: Map<number, string>,
): PoolQuestion[] {
  return questions.map((q) => ({
    ...q,
    ...(bankQuestionIds.has(q.index) ? { bankQuestionId: bankQuestionIds.get(q.index) } : {}),
  }));
}

interface PersistArgs {
  studentId: string;
  subtopicId: string;
  topicId: string;
  subject: string;
  classLevel: number;
  title: string;
  passage: string;
  questions: GeneratedQuestion[];
  validation?: ValidationOutcome;
}

/**
 * Store a freshly generated passage + questions to the bank, record them as seen
 * for this student, and (when provided) persist the validation score. Returns the
 * passage id and the assembled question pool.
 */
export async function persistGeneratedContent(
  args: PersistArgs,
): Promise<{ passageId: string; poolQuestions: PoolQuestion[] }> {
  const { studentId, subtopicId, topicId, subject, classLevel, title, passage, questions, validation } = args;

  const conceptTags = [...new Set(questions.map((q) => q.conceptTag))];

  const passageId = await passageBankService.storePassage(
    subtopicId,
    topicId,
    subject,
    classLevel,
    title,
    passage,
    conceptTags,
    questions,
  );

  if (validation) {
    await prisma.passageBank.update({
      where: { id: passageId },
      data: { validationScore: validation.aggregate, validationIssues: validation.issues },
    });
  }

  const storedQuestionIds = await prisma.passageBankQuestion
    .findMany({ where: { passageId }, orderBy: { index: "asc" }, select: { questionId: true, index: true } })
    .then((rows) => new Map(rows.map((r) => [r.index, r.questionId])));

  const poolQuestions = buildSessionPool(questions, storedQuestionIds);

  await passageBankService.recordPassageSeen(studentId, passageId);
  await Promise.all(
    Array.from(storedQuestionIds.values()).map((id) => questionBankService.recordQuestionSeen(studentId, id)),
  );

  return { passageId, poolQuestions };
}

/**
 * Preemptive generation may already have created an active session for this
 * subtopic moments ago. Reuse it instead of creating a duplicate.
 */
export async function findRecentActiveSession(studentId: string, subtopicId: string) {
  return prisma.session.findFirst({
    where: {
      studentId,
      subtopicId,
      sessionStatus: "active",
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
}

interface CreateSessionArgs {
  studentId: string;
  subtopicId: string;
  topicId: string;
  classLevel: number;
  passage: string;
  poolQuestions: PoolQuestion[];
  promptVersion: string;
  generationSummary?: string;
}

export async function createGeneratedSession(args: CreateSessionArgs) {
  const { studentId, subtopicId, topicId, classLevel, passage, poolQuestions, promptVersion, generationSummary } = args;

  return prisma.session.create({
    data: {
      studentId,
      subtopicId,
      topicId,
      neo4jTopicId: topicId,
      classLevel,
      passage,
      questions: poolQuestions.slice(0, 5),
      questionPool: poolQuestions,
      shownQuestions: [],
      pendingRetries: [],
      sessionStatus: "active",
      totalShown: 0,
      totalCorrect: 0,
      promptVersion,
      ...(generationSummary ? { generationSummary } : {}),
    },
  });
}

/** Attach a coverage summary to a session after the fact (fire-and-forget friendly). */
export async function attachGenerationSummary(sessionId: string, summary: string): Promise<void> {
  if (!summary) return;
  await prisma.session.update({ where: { id: sessionId }, data: { generationSummary: summary } });
}
