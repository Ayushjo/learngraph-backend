import { prisma } from "../db/prisma";
import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";
import {
  TOPICS,
  getNextSubtopic,
} from "../data/subtopics";
import { conceptService, ConceptState } from "./concept.service";

const COMPLETION_THRESHOLD = 0.6;

export interface SubtopicProgress {
  subtopicId: string;
  subtopicName: string;
  order: number;
  mastery: number;
  attempts: number;
  isComplete: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  trend: string | null;
  lastAttempted: Date | null;
}

export interface ChapterProgress {
  topicId: string;
  topicName: string;
  classLevel: number;
  subject: string;
  totalSubtopics: number;
  completedSubtopics: number;
  currentSubtopicId: string | null;
  chapterMastery: number;
  subtopics: SubtopicProgress[];
}

interface PrereqMastery {
  name: string;
  topicId: string;
  mastery: number;
  attempts: number;
  hop: 1 | 2;
}

interface WeakestPrerequisiteDetail {
  topicId: string;
  topicName: string;
  subtopics: Array<{
    subtopicId: string;
    subtopicName: string;
    mastery: number;
    isComplete: boolean;
    attempts: number;
  }>;
}

export const subtopicService = {
  async getChapterProgress(
    studentId: string,
    topicId: string,
  ): Promise<ChapterProgress> {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) throw new AppError(404, `Topic ${topicId} not found`);

    const masteryRecords = await prisma.subtopicMastery.findMany({
      where: {
        studentId,
        subtopic: { topicId },
      },
      include: { subtopic: true },
    });

    const masteryMap = new Map(masteryRecords.map((r) => [r.subtopicId, r]));

    const subtopics = topic.subtopics
      .sort((a, b) => a.order - b.order)
      .map((sub, index) => {
        const record = masteryMap.get(sub.id);
        const mastery = record?.mastery ?? 0;
        const isComplete = record?.isComplete ?? false;
        const attempts = record?.attempts ?? 0;

        const isUnlocked =
          index === 0
            ? true
            : (masteryMap.get(topic.subtopics[index - 1].id)?.isComplete ?? false);

        return {
          subtopicId: sub.id,
          subtopicName: sub.name,
          order: sub.order,
          mastery,
          attempts,
          isComplete,
          isUnlocked,
          isCurrent: isUnlocked && !isComplete,
          trend: record?.trend ?? null,
          lastAttempted: record?.lastAttempted ?? null,
        };
      });

    const currentSubtopic = subtopics.find((s) => s.isUnlocked && !s.isComplete);

    const chapterMastery =
      subtopics.length > 0
        ? subtopics.reduce((sum, s) => sum + s.mastery, 0) / subtopics.length
        : 0;

    return {
      topicId,
      topicName: topic.name,
      classLevel: topic.classLevel,
      subject: topic.subject,
      totalSubtopics: subtopics.length,
      completedSubtopics: subtopics.filter((s) => s.isComplete).length,
      currentSubtopicId: currentSubtopic?.subtopicId ?? null,
      chapterMastery: Math.round(chapterMastery * 10000) / 10000,
      subtopics,
    };
  },

  async updateSubtopicMastery(
    studentId: string,
    subtopicId: string,
  ): Promise<{
    subtopicId: string;
    previousMastery: number;
    newMastery: number;
    isComplete: boolean;
    justCompleted: boolean;
    trend: "improving" | "declining" | "stable";
    nextSubtopicId: string | null;
    chapterMastery: number;
  }> {
    const [existing, concepts] = await Promise.all([
      prisma.subtopicMastery.findUnique({
        where: { studentId_subtopicId: { studentId, subtopicId } },
        include: { subtopic: true },
      }),
      conceptService.getConceptsForSubtopic(studentId, subtopicId),
    ]);

    const previousMastery = existing?.mastery ?? 0;
    const attempts = existing?.attempts ?? 0;
    const wasComplete = existing?.isComplete ?? false;

    const newMastery =
      concepts.length > 0
        ? Math.round(
            (concepts.reduce((sum, c) => sum + c.effectiveMastery, 0) / concepts.length) * 10000,
          ) / 10000
        : previousMastery;

    const allConceptsAboveFloor = concepts.every((c) => c.effectiveMastery >= 0.3);
    const isComplete = wasComplete || (newMastery >= COMPLETION_THRESHOLD && allConceptsAboveFloor);
    const justCompleted = !wasComplete && isComplete;

    const trend: "improving" | "declining" | "stable" =
      newMastery > previousMastery + 0.05
        ? "improving"
        : newMastery < previousMastery - 0.05
          ? "declining"
          : "stable";

    await prisma.subtopicMastery.upsert({
      where: { studentId_subtopicId: { studentId, subtopicId } },
      update: {
        mastery: newMastery,
        attempts: attempts + 1,
        isComplete,
        trend,
        lastAttempted: new Date(),
      },
      create: {
        studentId,
        subtopicId,
        mastery: newMastery,
        attempts: 1,
        isComplete,
        trend,
        lastAttempted: new Date(),
      },
    });

    const subtopicDef =
      existing?.subtopic ??
      (await prisma.subtopic.findUnique({ where: { id: subtopicId } }));

    if (!subtopicDef) throw new AppError(404, "Subtopic not found");

    const nextSubtopicDef = getNextSubtopic(subtopicDef.topicId, subtopicDef.order);
    const nextSubtopicId = isComplete ? (nextSubtopicDef?.id ?? null) : null;

    const chapterMastery = await this.syncChapterMasteryToNeo4j(
      studentId,
      subtopicDef.topicId,
    );

    return {
      subtopicId,
      previousMastery,
      newMastery,
      isComplete,
      justCompleted,
      trend,
      nextSubtopicId,
      chapterMastery,
    };
  },

  async syncChapterMasteryToNeo4j(studentId: string, topicId: string): Promise<number> {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) return 0;

    const records = await prisma.subtopicMastery.findMany({
      where: { studentId, subtopic: { topicId } },
    });

    const totalSubtopics = topic.subtopics.length;
    const sumMastery = records.reduce((sum, r) => sum + r.mastery, 0);
    const chapterMastery = Math.round((sumMastery / totalSubtopics) * 10000) / 10000;

    const driver = getDriver();
    const session = driver.session();
    try {
      await session.run(`MERGE (s:Student {id: $studentId})`, { studentId });
      await session.run(
        `MATCH (s:Student {id: $studentId})
         MATCH (t:Topic {id: $topicId})
         MERGE (s)-[k:KNOWS]->(t)
         SET k.mastery       = $mastery,
             k.lastAttempted = $lastAttempted,
             k.attempts      = $attempts`,
        {
          studentId,
          topicId,
          mastery: chapterMastery,
          lastAttempted: new Date().toISOString(),
          attempts: records.length > 0 ? records.reduce((sum, r) => sum + r.attempts, 0) : 0,
        },
      );
    } finally {
      await session.close();
    }

    return chapterMastery;
  },

  async getStudentContextForSubtopic(
    studentId: string,
    subtopicId: string,
  ): Promise<{
    previousAttempts: number;
    previousMastery: number;
    weakCognitiveLevels: string[];
    prerequisiteGaps: string[];
    prerequisiteMasteries: PrereqMastery[];
    weakestPrerequisiteDetail: WeakestPrerequisiteDetail | null;
    completedSubtopicsInChapter: string[];
    wrongQuestions: Array<{
      questionText: string;
      chosenAnswer: string;
      correctAnswer: string;
      explanation: string;
      cognitiveLevel: string;
    }>;
    lastScorePercentage: number;
    conceptStates: ConceptState[];
  }> {
    const subtopic = await prisma.subtopic.findUnique({ where: { id: subtopicId } });
    if (!subtopic) throw new AppError(404, "Subtopic not found");

    const [masteryRecord, previousSessions, conceptStates] = await Promise.all([
      prisma.subtopicMastery.findUnique({
        where: { studentId_subtopicId: { studentId, subtopicId } },
      }),
      prisma.session.findMany({
        where: { studentId, subtopicId },
        include: { quizAttempt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      conceptService.getConceptsForSubtopic(studentId, subtopicId),
    ]);

    const weakCognitiveLevels: string[] = [];
    const wrongQuestions: Array<{
      questionText: string;
      chosenAnswer: string;
      correctAnswer: string;
      explanation: string;
      cognitiveLevel: string;
    }> = [];
    let lastScorePercentage = 0;

    if (previousSessions.length > 0) {
      const cogStats: Record<string, { correct: number; total: number }> = {};

      for (const sess of previousSessions) {
        const answers =
          (sess.quizAttempt?.answers as Array<{
            cognitiveLevel: string;
            isCorrect: boolean;
            chosen: number;
            correct: number;
            question: string;
            explanation: string;
          }>) ?? [];

        for (const a of answers) {
          if (!cogStats[a.cognitiveLevel])
            cogStats[a.cognitiveLevel] = { correct: 0, total: 0 };
          cogStats[a.cognitiveLevel].total++;
          if (a.isCorrect) cogStats[a.cognitiveLevel].correct++;
        }
      }

      for (const [level, stats] of Object.entries(cogStats)) {
        if (stats.correct / stats.total < 0.5) weakCognitiveLevels.push(level);
      }

      const lastSession = previousSessions[0];
      if (lastSession?.quizAttempt) {
        const answers =
          (lastSession.quizAttempt.answers as Array<{
            cognitiveLevel: string;
            isCorrect: boolean;
            chosen: number;
            correct: number;
          }>) ?? [];

        const questions =
          (lastSession.questions as Array<{
            cognitiveLevel: string;
            question: string;
            options: string[];
            correctIndex: number;
            explanation: string;
          }>) ?? [];

        const correctCount = answers.filter((a) => a.isCorrect).length;
        lastScorePercentage = answers.length > 0
          ? Math.round((correctCount / answers.length) * 100)
          : 0;

        for (let i = 0; i < answers.length; i++) {
          const answer = answers[i];
          const question = questions[i];
          if (!answer.isCorrect && question) {
            wrongQuestions.push({
              questionText: question.question,
              chosenAnswer: question.options[answer.chosen] ?? "Unknown",
              correctAnswer: question.options[question.correctIndex] ?? "Unknown",
              explanation: question.explanation,
              cognitiveLevel: answer.cognitiveLevel,
            });
          }
        }
      }
    }

    const completedRecords = await prisma.subtopicMastery.findMany({
      where: {
        studentId,
        isComplete: true,
        subtopic: { topicId: subtopic.topicId },
      },
      include: { subtopic: true },
    });
    const completedSubtopicsInChapter = completedRecords.map(
      (r) => r.subtopic.keyConceptsSummary,
    );

    const driver = getDriver();
    const neo4jSession = driver.session();
    const prereqGaps: string[] = [];
    const prereqMasteries: PrereqMastery[] = [];
    let weakestPrerequisiteDetail: WeakestPrerequisiteDetail | null = null;

    try {
      const result = await neo4jSession.run(
        `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(p1:Topic)
         OPTIONAL MATCH (p1)-[:REQUIRES]->(p2:Topic)
         OPTIONAL MATCH (s:Student {id: $studentId})-[k1:KNOWS]->(p1)
         OPTIONAL MATCH (s)-[k2:KNOWS]->(p2)
         RETURN p1.id AS p1id, p1.name AS p1name,
                coalesce(k1.mastery, 0.0) AS p1mastery,
                coalesce(k1.attempts, 0) AS p1attempts,
                p2.id AS p2id, p2.name AS p2name,
                coalesce(k2.mastery, 0.0) AS p2mastery,
                coalesce(k2.attempts, 0) AS p2attempts`,
        { topicId: subtopic.topicId, studentId },
      );

      const seenTopicIds = new Set<string>();

      for (const r of result.records) {
        const p1id = r.get("p1id") as string | null;
        const p1name = r.get("p1name") as string | null;
        const p1mastery = Number(r.get("p1mastery"));
        const p1attempts = Number(r.get("p1attempts"));

        if (p1id && !seenTopicIds.has(p1id)) {
          seenTopicIds.add(p1id);
          prereqMasteries.push({ name: p1name ?? p1id, topicId: p1id, mastery: p1mastery, attempts: p1attempts, hop: 1 });
          if (p1mastery < 0.5) prereqGaps.push(p1name ?? p1id);
        }

        const p2id = r.get("p2id") as string | null;
        const p2name = r.get("p2name") as string | null;
        const p2mastery = Number(r.get("p2mastery"));
        const p2attempts = Number(r.get("p2attempts"));

        if (p2id && !seenTopicIds.has(p2id)) {
          seenTopicIds.add(p2id);
          prereqMasteries.push({ name: p2name ?? p2id, topicId: p2id, mastery: p2mastery, attempts: p2attempts, hop: 2 });
          if (p2mastery < 0.5) prereqGaps.push(p2name ?? p2id);
        }
      }

      prereqMasteries.sort((a, b) => a.mastery - b.mastery);

      const weakest = prereqMasteries[0];
      if (weakest && weakest.mastery < 0.5) {
        const topicDef = TOPICS.find((t) => t.id === weakest.topicId);
        const subtopicMasteryRecords = await prisma.subtopicMastery.findMany({
          where: { studentId, subtopic: { topicId: weakest.topicId } },
          include: { subtopic: true },
        });
        const masteryBySubtopicId = new Map(subtopicMasteryRecords.map((r) => [r.subtopicId, r]));

        const subtopicRows = (topicDef?.subtopics ?? []).map((sub) => {
          const rec = masteryBySubtopicId.get(sub.id);
          return {
            subtopicId: sub.id,
            subtopicName: sub.name,
            mastery: rec?.mastery ?? 0,
            isComplete: rec?.isComplete ?? false,
            attempts: rec?.attempts ?? 0,
          };
        });

        weakestPrerequisiteDetail = {
          topicId: weakest.topicId,
          topicName: weakest.name,
          subtopics: subtopicRows,
        };
      }
    } finally {
      await neo4jSession.close();
    }

    return {
      previousAttempts: masteryRecord?.attempts ?? 0,
      previousMastery: masteryRecord?.mastery ?? 0,
      weakCognitiveLevels,
      prerequisiteGaps: prereqGaps,
      prerequisiteMasteries: prereqMasteries,
      weakestPrerequisiteDetail,
      completedSubtopicsInChapter,
      wrongQuestions,
      lastScorePercentage,
      conceptStates,
    };
  },

  async getAllChaptersProgress(
    studentId: string,
    subject: string,
    classLevel?: number,
  ) {
    const topics = TOPICS.filter(
      (t) =>
        t.subject === subject &&
        (classLevel ? t.classLevel === classLevel : true),
    );

    const allMasteryRecords = await prisma.subtopicMastery.findMany({
      where: {
        studentId,
        subtopic: {
          subject,
          ...(classLevel ? { classLevel } : {}),
        },
      },
      include: { subtopic: true },
    });

    const masteryMap = new Map(allMasteryRecords.map((r) => [r.subtopicId, r]));

    return topics.map((topic) => {
      const subtopics = topic.subtopics
        .sort((a, b) => a.order - b.order)
        .map((sub, index) => {
          const record = masteryMap.get(sub.id);
          const mastery = record?.mastery ?? 0;
          const isComplete = record?.isComplete ?? false;
          const attempts = record?.attempts ?? 0;

          const isUnlocked =
            index === 0
              ? true
              : (masteryMap.get(topic.subtopics[index - 1].id)?.isComplete ?? false);

          return {
            subtopicId: sub.id,
            subtopicName: sub.name,
            order: sub.order,
            mastery,
            attempts,
            isComplete,
            isUnlocked,
            isCurrent: isUnlocked && !isComplete,
            trend: record?.trend ?? null,
            lastAttempted: record?.lastAttempted ?? null,
          };
        });

      const chapterMastery =
        subtopics.length > 0
          ? subtopics.reduce((sum, s) => sum + s.mastery, 0) / subtopics.length
          : 0;

      const currentSubtopic = subtopics.find((s) => s.isUnlocked && !s.isComplete);

      return {
        topicId: topic.id,
        topicName: topic.name,
        classLevel: topic.classLevel,
        subject: topic.subject,
        totalSubtopics: subtopics.length,
        completedSubtopics: subtopics.filter((s) => s.isComplete).length,
        currentSubtopicId: currentSubtopic?.subtopicId ?? null,
        chapterMastery: Math.round(chapterMastery * 10000) / 10000,
        subtopics,
      };
    });
  },
};
