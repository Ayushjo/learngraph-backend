import { prisma } from "../db/prisma";

export interface PassageInfo {
  id: string;
  title: string;
  passage: string;
  subtopicId: string;
}

export interface StoredQuestion {
  index: number;
  conceptTag: string;
  cognitiveLevel: string;
  difficulty: number;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string;
}

export const passageBankService = {
  async findMatchingPassage(
    studentId: string,
    subtopicId: string,
    topicId: string,
    subject: string,
    classLevel: number,
  ): Promise<PassageInfo | null> {
    const seenIds = await prisma.studentSeenContent
      .findMany({ where: { studentId, contentType: "passage" }, select: { contentId: true } })
      .then((rows) => rows.map((r) => r.contentId));

    const baseWhere = {
      isActive: true,
      id: { notIn: seenIds.length > 0 ? seenIds : ["__none__"] },
    };

    const select = { id: true, title: true, passage: true, subtopicId: true };

    const tier1 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, subtopicId, classLevel },
      orderBy: { averageScore: "desc" },
      select,
    });
    if (tier1) return tier1;

    const tier2 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, topicId, classLevel, subtopicId: { not: subtopicId } },
      orderBy: { averageScore: "desc" },
      select,
    });
    if (tier2) return tier2;

    const tier3 = await prisma.passageBank.findFirst({
      where: { ...baseWhere, subject, classLevel, topicId: { not: topicId } },
      orderBy: { averageScore: "desc" },
      select,
    });
    return tier3 ?? null;
  },

  async storePassage(
    subtopicId: string,
    topicId: string,
    subject: string,
    classLevel: number,
    title: string,
    passage: string,
    conceptTags: string[],
    questions: StoredQuestion[],
  ): Promise<string> {
    const uniqueTags = [...new Set(conceptTags)];

    const passageRecord = await prisma.passageBank.create({
      data: { subtopicId, topicId, subject, classLevel, title, passage, conceptTags: uniqueTags },
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
        data: { passageId: passageRecord.id, questionId: questionRecord.id, index: q.index },
      });
    }

    return passageRecord.id;
  },

  async storeQuestionsForPassage(
    passageId: string,
    subtopicId: string,
    questions: StoredQuestion[],
  ): Promise<string[]> {
    const ids: string[] = [];
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
        data: { passageId, questionId: questionRecord.id, index: q.index },
      });
      ids.push(questionRecord.id);
    }
    return ids;
  },

  async updatePassageQuality(passageId: string): Promise<void> {
    const links = await prisma.passageBankQuestion.findMany({
      where: { passageId },
      include: { question: true },
    });
    if (links.length === 0) return;

    const answered = links.filter((l) => l.question.timesAnswered > 0);
    if (answered.length === 0) return;

    const averageScore =
      answered.reduce((sum, l) => sum + l.question.timesCorrect / l.question.timesAnswered, 0) /
      answered.length;

    await prisma.passageBank.update({ where: { id: passageId }, data: { averageScore } });
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
