import { prisma } from "../db/prisma";
import { masteryService } from "./mastery.service";
import { AppError } from "../middleware/errorHandler";
import { Prisma } from "@prisma/client";
// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitQuizInput {
  studentId: string;
  sessionId: string;
  // Array of chosen option indices (0-3) for each question
  // e.g. [1, 2, 0, 3, 1] means student chose index 1 for Q1, 2 for Q2 etc.
  answers: number[];
}

export interface AnswerResult {
  questionIndex: number;
  cognitiveLevel: string;
  question: string;
  chosen: number; // index student chose
  correct: number; // correct index
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  percentage: number;
  grade: string;
  answerResults: AnswerResult[];
  mastery: {
    topicId: string;
    topicName: string;
    previousMastery: number;
    newMastery: number;
    trend: string;
    masteryLevel: string;
    attempts: number;
  };
  prerequisiteBoosts: Array<{
    topicId: string;
    topicName: string;
    previousMastery: number;
    newMastery: number;
  }>;
  knowledgeGaps: Array<{
    topicId: string;
    topicName: string;
    mastery: number;
    masteryLevel: string;
  }>;
  message: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const getGrade = (percentage: number): string => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Needs Practice";
  return "Keep Trying";
};

const getResultMessage = (
  percentage: number,
  topicName: string,
  trend: string,
): string => {
  if (percentage === 100)
    return `Perfect score on ${topicName}! You have a strong grasp of this topic.`;
  if (percentage >= 80 && trend === "improving")
    return `Great work on ${topicName}! You are improving steadily.`;
  if (percentage >= 80)
    return `Strong performance on ${topicName}! Keep it up.`;
  if (percentage >= 60)
    return `Good effort on ${topicName}. A little more practice will get you there.`;
  if (percentage >= 40 && trend === "improving")
    return `You are making progress on ${topicName}. Focus on the gaps identified below.`;
  if (percentage >= 40)
    return `${topicName} needs more practice. Review the explanations carefully.`;
  return `${topicName} is challenging right now. Consider revisiting the prerequisite topics first.`;
};

// ─── Service ──────────────────────────────────────────────────────────────────
const getStudentTopicContext = async (
  studentId: string,
  neo4jTopicId: string,
  sessionId: string,
): Promise<{
  previousAttempts: number;
  previousMastery: number;
  weakCognitiveLevels: string[];
  prerequisiteGaps: string[];
}> => {
  // Get previous quiz attempts for this topic
  const previousAttempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
      session: { neo4jTopicId },
      NOT: { sessionId }, // exclude current session
    },
    include: { session: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Find weak cognitive levels from previous attempts
  const weakCognitiveLevels: string[] = [];
  if (previousAttempts.length > 0) {
    const allAnswers = previousAttempts.flatMap(
      (a) => a.answers as Array<{ cognitiveLevel: string; isCorrect: boolean }>,
    );
    const cogLevelStats: Record<string, { correct: number; total: number }> =
      {};
    for (const answer of allAnswers) {
      if (!cogLevelStats[answer.cognitiveLevel]) {
        cogLevelStats[answer.cognitiveLevel] = { correct: 0, total: 0 };
      }
      cogLevelStats[answer.cognitiveLevel].total++;
      if (answer.isCorrect) cogLevelStats[answer.cognitiveLevel].correct++;
    }
    for (const [level, stats] of Object.entries(cogLevelStats)) {
      if (stats.correct / stats.total < 0.5) weakCognitiveLevels.push(level);
    }
  }

  // Get prerequisite gaps from Neo4j
  const { getDriver } = await import("../db/neo4j");
  const driver = getDriver();
  const neo4jSession = driver.session();
  const prereqGaps: string[] = [];

  try {
    const gapResult = await neo4jSession.run(
      `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
       OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
       WITH prereq, coalesce(k.mastery, 0.0) AS prereqMastery
       WHERE prereqMastery < 0.5
       RETURN prereq.name AS name`,
      { topicId: neo4jTopicId, studentId },
    );
    for (const record of gapResult.records) {
      prereqGaps.push(record.get("name") as string);
    }
  } finally {
    await neo4jSession.close();
  }

  // Get current mastery
  const { masteryService } = await import("./mastery.service");
  const topicMastery = await masteryService.getTopicMastery(
    studentId,
    neo4jTopicId,
  );

  return {
    previousAttempts: previousAttempts.length,
    previousMastery: topicMastery.mastery,
    weakCognitiveLevels,
    prerequisiteGaps: prereqGaps,
  };
};

export const quizService = {
  async submitQuiz(input: SubmitQuizInput): Promise<QuizSubmitResult> {
    const { studentId, sessionId, answers } = input;

    // ── Step 1: Validate inputs ───────────────────────────────────────────────
    if (!answers || answers.length !== 5) {
      throw new AppError(400, "Exactly 5 answers are required");
    }

    if (answers.some((a) => a < 0 || a > 3)) {
      throw new AppError(400, "Each answer must be an index between 0 and 3");
    }

    // ── Step 2: Fetch session from Postgres ───────────────────────────────────
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { topic: true },
    });

    if (!session) {
      throw new AppError(404, "Session not found");
    }

    // ── Step 3: Check if already attempted ───────────────────────────────────
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: { sessionId },
    });

    if (existingAttempt) {
      throw new AppError(409, "This session has already been attempted");
    }

    // ── Step 4: Score the answers ─────────────────────────────────────────────
    const questions = session.questions as Array<{
      index: number;
      cognitiveLevel: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;

    let score = 0;
    const answerResults: AnswerResult[] = questions.map((q, i) => {
      const chosen = answers[i];
      const isCorrect = chosen === q.correctIndex;
      if (isCorrect) score++;

      return {
        questionIndex: i,
        cognitiveLevel: q.cognitiveLevel,
        question: q.question,
        chosen,
        correct: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    // ── Step 5: Save attempt to Postgres ──────────────────────────────────────
    await prisma.quizAttempt.create({
      data: {
        studentId,
        sessionId,
        score,
        total,
        answers: answerResults as unknown as Prisma.InputJsonValue,
      },
    });

    // ── Step 6: Update mastery in Neo4j ───────────────────────────────────────
    // We use the Neo4j topic id (from our seed) not the Postgres topic id
    // The session stores topicId as Postgres cuid — we need the Neo4j id
    // So we use topic name + classLevel to find the Neo4j node id
    const neo4jTopicId = session.neo4jTopicId;

    const masteryResult = await masteryService.updateMastery({
      studentId,
      topicId: neo4jTopicId,
      score,
      total,
    });

    const message = getResultMessage(
      percentage,
      session.topic.name,
      masteryResult.trend,
    );

    return {
      score,
      total,
      percentage,
      grade: getGrade(percentage),
      answerResults,
      mastery: {
        topicId: masteryResult.topicId,
        topicName: masteryResult.topicName,
        previousMastery: masteryResult.previousMastery,
        newMastery: masteryResult.newMastery,
        trend: masteryResult.trend,
        masteryLevel: masteryResult.masteryLevel,
        attempts: masteryResult.attempts,
      },
      prerequisiteBoosts: masteryResult.prerequisiteBoosts,
      knowledgeGaps: masteryResult.knowledgeGaps,
      message,
    };
  },

  // Fetch an existing attempt result (for page refresh)
  async getAttempt(sessionId: string, studentId: string) {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { sessionId, studentId },
      include: {
        session: {
          include: { topic: true },
        },
      },
    });

    if (!attempt) {
      throw new AppError(404, "Attempt not found");
    }

    return attempt;
  },

  // New method — check if session has attempt
  async getSessionWithAttempt(sessionId: string, studentId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: {
        topic: true,
        quizAttempt: true,
      },
    });

    if (!session) {
      throw new AppError(404, "Session not found");
    }

    return session;
  },
};

