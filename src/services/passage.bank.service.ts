import { prisma } from "../db/prisma";
import { PassageBank, PassageBankQuestion } from "@prisma/client";

export interface StoredPassage {
  id: string;
  title: string;
  passage: string;
  questions: Array<{
    id: string;
    index: number;
    conceptTag: string;
    cognitiveLevel: string;
    difficulty: number;
    question: string;
    options: unknown;
    correctIndex: number;
    explanation: string;
  }>;
}

export const passageBankService = {
  async findMatchingPassage(
    studentId: string,
    subtopicId: string,
    topicId: string,
    subject: string,
    classLevel: number,
  ): Promise<StoredPassage | null> {
    const seenIds = await prisma.studentSeenContent
      .findMany({
        where: { studentId, contentType: "passage" },
        select: { contentId: true },
      })
      .then((rows) => rows.map((r) => r.contentId));

    const baseWhere = {
      isActive: true,
      id: { notIn: seenIds.length > 0 ? seenIds : ["__none__"] },
    };

    const tier1 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, subtopicId, classLevel },
      orderBy: { averageScore: "desc" },
      include: {
        questions: {
          orderBy: { index: "asc" },
          include: { question: true },
        },
      },
    });

    if (tier1) return this.toStoredPassage(tier1);

    const tier2 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, topicId, classLevel, subtopicId: { not: subtopicId } },
      orderBy: { averageScore: "desc" },
      include: {
        questions: {
          orderBy: { index: "asc" },
          include: { question: true },
        },
      },
    });

    if (tier2) return this.toStoredPassage(tier2);

    const tier3 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, subject, classLevel, topicId: { not: topicId } },
      orderBy: { averageScore: "desc" },
      include: {
        questions: {
          orderBy: { index: "asc" },
          include: { question: true },
        },
      },
    });

    return tier3 ? this.toStoredPassage(tier3) : null;
  },

  toStoredPassage(
    row: PassageBank & {
      questions: Array<PassageBankQuestion & { question: { id: string; index?: number; conceptTag: string; cognitiveLevel: string; difficulty: number; question: string; options: unknown; correctIndex: number; explanation: string } }>;
    },
  ): StoredPassage {
    return {
      id: row.id,
      title: row.title,
      passage: row.passage,
      questions: row.questions.map((pq) => ({
        id: pq.question.id,
        index: pq.index,
        conceptTag: pq.question.conceptTag,
        cognitiveLevel: pq.question.cognitiveLevel,
        difficulty: pq.question.difficulty,
        question: pq.question.question,
        options: pq.question.options,
        correctIndex: pq.question.correctIndex,
        explanation: pq.question.explanation,
      })),
    };
  },

  async storePassage(
    subtopicId: string,
    topicId: string,
    subject: string,
    classLevel: number,
    title: string,
    passage: string,
    questions: Array<{
      index: number;
      conceptTag: string;
      cognitiveLevel: string;
      difficulty: number;
      question: string;
      options: unknown;
      correctIndex: number;
      explanation: string;
    }>,
  ): Promise<string> {
    const passageRecord = await prisma.passageBank.create({
      data: { subtopicId, topicId, subject, classLevel, title, passage },
    });

    for (const q of questions) {
      const questionRecord = await prisma.questionBank.create({
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
      });

      await prisma.passageBankQuestion.create({
        data: {
          passageId: passageRecord.id,
          questionId: questionRecord.id,
          index: q.index,
        },
      });
    }

    return passageRecord.id;
  },

  async updatePassageQuality(passageId: string): Promise<void> {
    const links = await prisma.passageBankQuestion.findMany({
      where: { passageId },
      include: { question: true },
    });

    if (links.length === 0) return;

    const answeredQuestions = links.filter((l) => l.question.timesAnswered > 0);
    if (answeredQuestions.length === 0) return;

    const averageScore =
      answeredQuestions.reduce(
        (sum, l) =>
          sum + (l.question.timesAnswered > 0 ? l.question.timesCorrect / l.question.timesAnswered : 0),
        0,
      ) / answeredQuestions.length;

    await prisma.passageBank.update({
      where: { id: passageId },
      data: { averageScore },
    });
  },

  async recordPassageSeen(studentId: string, passageId: string): Promise<void> {
    await prisma.$transaction([
      prisma.studentSeenContent.upsert({
        where: {
          studentId_contentType_contentId: {
            studentId,
            contentType: "passage",
            contentId: passageId,
          },
        },
        update: {},
        create: { studentId, contentType: "passage", contentId: passageId },
      }),
      prisma.passageBank.update({
        where: { id: passageId },
        data: { timesUsed: { increment: 1 } },
      }),
    ]);
  },
};
