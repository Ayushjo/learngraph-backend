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

