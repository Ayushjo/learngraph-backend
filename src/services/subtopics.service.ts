import { prisma } from "../db/prisma";
import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";
import {
  TOPICS,
  getSubtopicsByTopic,
  getNextSubtopic,
} from "../data/subtopics";

// Mastery threshold to consider a subtopic complete
const COMPLETION_THRESHOLD = 0.6;

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export const subtopicService = {
  // Get full chapter progress for a student
  async getChapterProgress(
    studentId: string,
    topicId: string,
  ): Promise<ChapterProgress> {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) throw new AppError(404, `Topic ${topicId} not found`);

    // Get all mastery records for this student + chapter
    const masteryRecords = await prisma.subtopicMastery.findMany({
      where: {
        studentId,
        subtopic: { topicId },
      },
      include: { subtopic: true },
    });

    // Build mastery map for quick lookup
    const masteryMap = new Map(masteryRecords.map((r) => [r.subtopicId, r]));

    // Build progress for each subtopic
    const subtopics = topic.subtopics
      .sort((a, b) => a.order - b.order)
      .map((sub, index) => {
        const record = masteryMap.get(sub.id);
        const mastery = record?.mastery ?? 0;
        const isComplete = record?.isComplete ?? false;
        const attempts = record?.attempts ?? 0;

        // Subtopic is unlocked if:
        // - It's the first subtopic (always unlocked)
        // - OR the previous subtopic is complete
        const isUnlocked =
          index === 0
            ? true
            : (masteryMap.get(topic.subtopics[index - 1].id)?.isComplete ??
              false);

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

    // Current subtopic = first unlocked and not complete
    const currentSubtopic = subtopics.find(
      (s) => s.isUnlocked && !s.isComplete,
    );

    // Chapter mastery = average of all subtopic masteries
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

  // Update subtopic mastery after a quiz
  // Returns updated progress + whether subtopic was just completed
  async updateSubtopicMastery(
    studentId: string,
    subtopicId: string,
    score: number,
    total: number,
  ): Promise<{
    subtopicId: string;
    previousMastery: number;
    newMastery: number;
    isComplete: boolean;
    justCompleted: boolean; // was NOT complete before, IS complete now
    trend: "improving" | "declining" | "stable";
    nextSubtopicId: string | null;
    chapterMastery: number;
  }> {
    const scorePercent = score / total;

    // Get current record
    const existing = await prisma.subtopicMastery.findUnique({
      where: { studentId_subtopicId: { studentId, subtopicId } },
      include: { subtopic: true },
    });

    const previousMastery = existing?.mastery ?? 0;
    const attempts = existing?.attempts ?? 0;
    const wasComplete = existing?.isComplete ?? false;

    // Calculate new mastery using weighted formula
    const alpha = attempts === 0 ? 0.6 : attempts === 1 ? 0.4 : 0.3;
    const rawMastery =
      previousMastery + alpha * (scorePercent - previousMastery);
    const newMastery =
      attempts === 0
        ? Math.round(scorePercent * 10000) / 10000
        : Math.round(
            Math.min(
              1,
              Math.max(
                0,
                previousMastery + alpha * (scorePercent - previousMastery),
              ),
            ) * 10000,
          ) / 10000;

    // Determine trend
    const trend: "improving" | "declining" | "stable" =
      scorePercent > previousMastery + 0.05
        ? "improving"
        : scorePercent < previousMastery - 0.1
          ? "declining"
          : "stable";

    // Subtopic is complete if mastery crosses threshold
    const isComplete = newMastery >= COMPLETION_THRESHOLD || wasComplete;

    const justCompleted = !wasComplete && isComplete;

    // Upsert mastery record
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

    // Get subtopic definition for next subtopic lookup
    const subtopicDef =
      existing?.subtopic ??
      (await prisma.subtopic.findUnique({ where: { id: subtopicId } }));

    if (!subtopicDef) throw new AppError(404, "Subtopic not found");

    // Find next subtopic
    const nextSubtopicDef = getNextSubtopic(
      subtopicDef.topicId,
      subtopicDef.order,
    );
    const nextSubtopicId = isComplete ? (nextSubtopicDef?.id ?? null) : null;

    // Recalculate chapter mastery and update Neo4j
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

  // Recalculate chapter mastery from subtopics and sync to Neo4j
  async syncChapterMasteryToNeo4j(
    studentId: string,
    topicId: string,
  ): Promise<number> {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) return 0;

    // Get all subtopic masteries for this chapter
    const records = await prisma.subtopicMastery.findMany({
      where: {
        studentId,
        subtopic: { topicId },
      },
    });

    // Chapter mastery = sum of all subtopic masteries / total subtopics
    const totalSubtopics = topic.subtopics.length;
    const sumMastery = records.reduce((sum, r) => sum + r.mastery, 0);
    const chapterMastery =
      Math.round((sumMastery / totalSubtopics) * 10000) / 10000;

    // Update Neo4j KNOWS relationship at chapter level
    const driver = getDriver();
    const session = driver.session();
    try {
      // Ensure student node exists
      await session.run(`MERGE (s:Student {id: $studentId})`, { studentId });

      // Update chapter mastery
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
          attempts:
            records.length > 0
              ? records.reduce((sum, r) => sum + r.attempts, 0)
              : 0,
        },
      );
    } finally {
      await session.close();
    }

    return chapterMastery;
  },

  // Get student context for Claude — what subtopics are done, what was weak
  async getStudentContextForSubtopic(
    studentId: string,
    subtopicId: string,
  ): Promise<{
    previousAttempts: number;
    previousMastery: number;
    weakCognitiveLevels: string[];
    prerequisiteGaps: string[];
    prerequisiteMasteries: Array<{
      name: string;
      topicId: string;
      mastery: number;
      attempts: number;
    }>;
    completedSubtopicsInChapter: string[];
    wrongQuestions: Array<{
      questionText: string;
      chosenAnswer: string;
      correctAnswer: string;
      explanation: string;
      cognitiveLevel: string;
    }>;
    lastScorePercentage: number;
  }> {
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
    });
    if (!subtopic) throw new AppError(404, "Subtopic not found");

    // Get mastery record for this subtopic
    const masteryRecord = await prisma.subtopicMastery.findUnique({
      where: { studentId_subtopicId: { studentId, subtopicId } },
    });

    // Get previous sessions for this subtopic to find weak cognitive levels
    const previousSessions = await prisma.session.findMany({
      where: { studentId, subtopicId },
      include: { quizAttempt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

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
      // Build cognitive level stats across all previous attempts
      const cogStats: Record<string, { correct: number; total: number }> = {};

      for (const session of previousSessions) {
        const answers =
          (session.quizAttempt?.answers as Array<{
            cognitiveLevel: string;
            isCorrect: boolean;
            chosen: number;
            correct: number;
            question: string;
            explanation: string;
          }>) ?? [];

        const questions =
          (session.questions as Array<{
            cognitiveLevel: string;
            question: string;
            options: string[];
            correctIndex: number;
            explanation: string;
          }>) ?? [];

        for (const a of answers) {
          if (!cogStats[a.cognitiveLevel])
            cogStats[a.cognitiveLevel] = { correct: 0, total: 0 };
          cogStats[a.cognitiveLevel].total++;
          if (a.isCorrect) cogStats[a.cognitiveLevel].correct++;
        }
      }

      // Determine weak cognitive levels (< 50% correct)
      for (const [level, stats] of Object.entries(cogStats)) {
        if (stats.correct / stats.total < 0.5) weakCognitiveLevels.push(level);
      }

      // Extract wrong questions from the MOST RECENT session only
      // (most recent = index 0 since we order by createdAt desc)
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

        // Calculate last score percentage
        const correctCount = answers.filter((a) => a.isCorrect).length;
        lastScorePercentage = Math.round((correctCount / answers.length) * 100);

        // Collect wrong questions with full context
        for (let i = 0; i < answers.length; i++) {
          const answer = answers[i];
          const question = questions[i];
          if (!answer.isCorrect && question) {
            wrongQuestions.push({
              questionText: question.question,
              chosenAnswer: question.options[answer.chosen] ?? "Unknown",
              correctAnswer:
                question.options[question.correctIndex] ?? "Unknown",
              explanation: question.explanation,
              cognitiveLevel: answer.cognitiveLevel,
            });
          }
        }
      }
    }

    // Get completed subtopics in this chapter (for context — don't repeat these)
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

    // Get prerequisite gaps from Neo4j (chapter level)
    // Get prerequisite gaps from Neo4j WITH mastery scores
    const driver = getDriver();
    const neo4jSession = driver.session();
    const prereqGaps: string[] = [];
    const prereqMasteries: Array<{
      name: string;
      topicId: string;
      mastery: number;
      attempts: number;
    }> = [];

    try {
      const result = await neo4jSession.run(
        `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
         WITH prereq,
              coalesce(k.mastery, 0.0) AS m,
              coalesce(k.attempts, 0) AS a
         RETURN prereq.name AS name, prereq.id AS id, m AS mastery, a AS attempts
         ORDER BY m ASC`,
        { topicId: subtopic.topicId, studentId },
      );
      for (const r of result.records) {
        const mastery = Number(r.get("mastery"));
        const attempts = Number(r.get("attempts"));
        prereqMasteries.push({
          name: r.get("name") as string,
          topicId: r.get("id") as string,
          mastery,
          attempts,
        });
        if (mastery < 0.5) prereqGaps.push(r.get("name") as string);
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
      completedSubtopicsInChapter,
      wrongQuestions,
      lastScorePercentage,
    };
  },

  // Get all chapters with progress for a student (for the dashboard)
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

    // Single query — get ALL subtopic mastery records for this student
    // across all chapters at once
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

    // Build mastery map for O(1) lookup
    const masteryMap = new Map(allMasteryRecords.map((r) => [r.subtopicId, r]));

    // Build progress for each topic without additional DB calls
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
              : (masteryMap.get(topic.subtopics[index - 1].id)?.isComplete ??
                false);

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

      const currentSubtopic = subtopics.find(
        (s) => s.isUnlocked && !s.isComplete,
      );

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
