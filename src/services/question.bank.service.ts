import { prisma } from "../db/prisma";

export interface BankQuestion {
  id: string;
  index: number;
  conceptTag: string;
  cognitiveLevel: string;
  difficulty: number;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string;
}

export interface AssemblySlot {
  index: number;
  conceptTag: string;
  cognitiveLevel: string;
  targetDifficulty: number;
}

const IRT_DIFFICULTY_WINDOW = 0.2;

const toQuestion = (row: {
  id: string;
  conceptTag: string;
  cognitiveLevel: string;
  difficulty: number;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string;
}, index: number): BankQuestion => ({
  id: row.id,
  index,
  conceptTag: row.conceptTag,
  cognitiveLevel: row.cognitiveLevel,
  difficulty: row.difficulty,
  question: row.question,
  options: row.options,
  correctIndex: row.correctIndex,
  explanation: row.explanation,
});

async function queryOne(
  subtopicId: string,
  conceptTag: string,
  cognitiveLevel: string | null,
  targetDifficulty: number,
  diffWindow: number,
  excludeIds: string[],
): Promise<BankQuestion | null> {
  const low = Math.max(0, targetDifficulty - diffWindow);
  const high = Math.min(1, targetDifficulty + diffWindow);

  const row = await prisma.questionBank.findFirst({
    where: {
      subtopicId,
      conceptTag,
      ...(cognitiveLevel ? { cognitiveLevel } : {}),
      isActive: true,
      difficulty: { gte: low, lte: high },
      id: { notIn: excludeIds.length > 0 ? excludeIds : ["__none__"] },
    },
    orderBy: [{ discriminationIndex: "desc" }, { timesAnswered: "desc" }],
  });

  return row ? toQuestion(row, 0) : null;
}

export const questionBankService = {
  async assembleQuestionPool(
    studentId: string,
    subtopicId: string,
    slots: AssemblySlot[],
  ): Promise<BankQuestion[] | null> {
    const seenIds = await prisma.studentSeenContent
      .findMany({ where: { studentId, contentType: "question" }, select: { contentId: true } })
      .then((rows) => rows.map((r) => r.contentId));

    const excludeIds = [...seenIds];
    const assembled: BankQuestion[] = [];

    for (const slot of slots) {
      const found =
        (await queryOne(subtopicId, slot.conceptTag, slot.cognitiveLevel, slot.targetDifficulty, IRT_DIFFICULTY_WINDOW, excludeIds)) ??
        (await queryOne(subtopicId, slot.conceptTag, null, slot.targetDifficulty, IRT_DIFFICULTY_WINDOW, excludeIds)) ??
        (await queryOne(subtopicId, slot.conceptTag, null, slot.targetDifficulty, 0.4, excludeIds));

      if (!found) return null;

      excludeIds.push(found.id);
      assembled.push({ ...found, index: slot.index });
    }

    return assembled;
  },

  async findQuestionsForConcept(
    studentId: string,
    subtopicId: string,
    conceptTag: string,
    cognitiveLevel: string,
    targetDifficulty: number,
    count: number,
  ): Promise<BankQuestion[]> {
    const seenIds = await prisma.studentSeenContent
      .findMany({ where: { studentId, contentType: "question" }, select: { contentId: true } })
      .then((rows) => rows.map((r) => r.contentId));

    const low = Math.max(0, targetDifficulty - IRT_DIFFICULTY_WINDOW);
    const high = Math.min(1, targetDifficulty + IRT_DIFFICULTY_WINDOW);

    const questions = await prisma.questionBank.findMany({
      where: {
        subtopicId,
        conceptTag,
        cognitiveLevel,
        isActive: true,
        difficulty: { gte: low, lte: high },
        id: { notIn: seenIds.length > 0 ? seenIds : ["__none__"] },
      },
      orderBy: [{ discriminationIndex: "desc" }, { timesAnswered: "desc" }],
      take: count,
    });

    return questions.map((q, i) => toQuestion(q, i));
  },

  async storeQuestions(
    subtopicId: string,
    questions: Array<{
      conceptTag: string;
      cognitiveLevel: string;
      difficulty: number;
      question: string;
      options: unknown;
      correctIndex: number;
      explanation: string;
    }>,
  ): Promise<string[]> {
    const created = await Promise.all(
      questions.map((q) =>
        prisma.questionBank.create({
          data: {
            subtopicId,
            conceptTag: q.conceptTag,
            cognitiveLevel: q.cognitiveLevel,
            difficulty: q.difficulty,
            question: q.question,
            options: q.options as never,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          },
        }),
      ),
    );
    return created.map((q) => q.id);
  },

  async updateQuestionIRT(questionId: string, isCorrect: boolean): Promise<void> {
    const q = await prisma.questionBank.findUnique({ where: { id: questionId } });
    if (!q) return;

    const newTimesAnswered = q.timesAnswered + 1;
    const newTimesCorrect = q.timesCorrect + (isCorrect ? 1 : 0);
    const correctRate = newTimesCorrect / newTimesAnswered;

    const newDifficulty =
      newTimesAnswered < 5 ? q.difficulty : Math.round((1 - correctRate) * 100) / 100;

    let newDiscrimination = q.discriminationIndex;
    if (newTimesAnswered >= 20) {
      const pq = correctRate * (1 - correctRate);
      newDiscrimination = Math.round(Math.sqrt(pq) * 100) / 100;
    }

    await prisma.questionBank.update({
      where: { id: questionId },
      data: {
        timesAnswered: newTimesAnswered,
        timesCorrect: newTimesCorrect,
        difficulty: newDifficulty,
        discriminationIndex: newDiscrimination,
      },
    });
  },

  async recordQuestionSeen(studentId: string, questionId: string): Promise<void> {
    await prisma.studentSeenContent.upsert({
      where: {
        studentId_contentType_contentId: { studentId, contentType: "question", contentId: questionId },
      },
      update: {},
      create: { studentId, contentType: "question", contentId: questionId },
    });
  },

  async recordQuestionResult(
    studentId: string,
    questionId: string,
    isCorrect: boolean,
  ): Promise<void> {
    await Promise.all([
      this.recordQuestionSeen(studentId, questionId),
      this.updateQuestionIRT(questionId, isCorrect),
    ]);
  },
};
