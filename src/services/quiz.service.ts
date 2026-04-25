import { prisma } from "../db/prisma";
import { subtopicService } from "./subtopics.service";
import { conceptService } from "./concept.service";
import { questionBankService } from "./question.bank.service";
import { AppError } from "../middleware/errorHandler";
import { Prisma } from "@prisma/client";
import { getDriver } from "../db/neo4j";

export interface SubmitQuizInput {
  studentId: string;
  sessionId: string;
  answers: number[];
}

export interface SubmitAnswerInput {
  studentId: string;
  sessionId: string;
  questionIndex: number;
  chosenAnswer: number;
}

export interface AnswerResult {
  questionIndex: number;
  cognitiveLevel: string;
  question: string;
  chosen: number;
  correct: number;
  isCorrect: boolean;
  explanation: string;
}

interface PoolQuestion {
  index: number;
  cognitiveLevel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
  difficulty: number;
  bankQuestionId?: string;
}

type NextQuestion = Omit<PoolQuestion, "correctIndex" | "explanation">;

interface SessionSummary {
  score: number;
  total: number;
  percentage: number;
  grade: string;
}

const getGrade = (pct: number): string => {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs Practice";
  return "Keep Trying";
};

const getMessage = (pct: number, name: string, trend: string): string => {
  if (pct === 100) return `Perfect score on ${name}! Subtopic complete.`;
  if (pct >= 60 && trend === "improving") return `${name} complete! Moving to the next subtopic.`;
  if (pct >= 60) return `Good work — ${name} is now complete!`;
  if (pct >= 40) return `Getting there on ${name}. One more attempt should do it.`;
  return `${name} needs more practice. Try again with a fresh passage.`;
};

const resolveNextQuestion = (
  pool: PoolQuestion[],
  shownQuestions: number[],
  pendingRetries: number[],
  totalShown: number,
): NextQuestion | null => {
  if (totalShown >= 10) return null;

  let nextIdx: number | null = null;

  if (pendingRetries.length > 0) {
    nextIdx = pendingRetries[0];
  } else {
    for (let i = 0; i < 5; i++) {
      if (!shownQuestions.includes(i)) {
        nextIdx = i;
        break;
      }
    }
  }

  if (nextIdx === null) return null;

  const q = pool.find((pq) => pq.index === nextIdx);
  if (!q) return null;

  return {
    index: q.index,
    cognitiveLevel: q.cognitiveLevel,
    question: q.question,
    options: q.options,
    conceptTag: q.conceptTag,
    difficulty: q.difficulty,
  };
};

export const quizService = {
  async submitAnswer(input: SubmitAnswerInput): Promise<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    conceptTag: string;
    totalShown: number;
    totalCorrect: number;
    sessionComplete: boolean;
    nextQuestion: NextQuestion | null;
    summary: SessionSummary | null;
  }> {
    const { studentId, sessionId, questionIndex, chosenAnswer } = input;

    if (chosenAnswer < 0 || chosenAnswer > 3) {
      throw new AppError(400, "Answer must be 0–3");
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
    });
    if (!session) throw new AppError(404, "Session not found");
    if (session.sessionStatus === "complete") throw new AppError(409, "Session already complete");

    const pool = session.questionPool as unknown as PoolQuestion[];
    if (!pool.length) throw new AppError(400, "Session has no question pool — regenerate session");

    const question = pool.find((q) => q.index === questionIndex);
    if (!question) throw new AppError(400, `Question index ${questionIndex} not in pool`);

    const shownQuestions = session.shownQuestions as unknown as number[];
    if (shownQuestions.includes(questionIndex)) throw new AppError(409, "Question already answered");

    const pendingRetries = session.pendingRetries as unknown as number[];

    const isCorrect = chosenAnswer === question.correctIndex;

    const conceptId = `${session.subtopicId}_${question.conceptTag}`;
    await conceptService.updateConceptMastery(studentId, conceptId, isCorrect, question.cognitiveLevel, question.difficulty);

    if (question.bankQuestionId) {
      questionBankService.updateQuestionIRT(question.bankQuestionId, isCorrect).catch(() => {});
    }

    const newPendingRetries = pendingRetries.filter((idx) => idx !== questionIndex);

    if (!isCorrect) {
      const backup = pool.find(
        (q) =>
          q.index >= 5 &&
          q.conceptTag === question.conceptTag &&
          !shownQuestions.includes(q.index) &&
          !newPendingRetries.includes(q.index),
      );
      if (backup) newPendingRetries.push(backup.index);
    }

    const newShownQuestions = [...shownQuestions, questionIndex];
    const newTotalShown = session.totalShown + 1;
    const newTotalCorrect = session.totalCorrect + (isCorrect ? 1 : 0);

    const nextQuestion = resolveNextQuestion(pool, newShownQuestions, newPendingRetries, newTotalShown);
    const sessionComplete = nextQuestion === null;
    const newStatus = sessionComplete ? "complete" : "active";

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        shownQuestions: newShownQuestions as unknown as Prisma.InputJsonValue,
        pendingRetries: newPendingRetries as unknown as Prisma.InputJsonValue,
        totalShown: newTotalShown,
        totalCorrect: newTotalCorrect,
        sessionStatus: newStatus,
      },
    });

    if (sessionComplete) {
      await subtopicService.updateSubtopicMastery(studentId, session.subtopicId);
    }

    const summary: SessionSummary | null = sessionComplete
      ? {
          score: newTotalCorrect,
          total: newTotalShown,
          percentage: newTotalShown > 0 ? Math.round((newTotalCorrect / newTotalShown) * 100) : 0,
          grade: getGrade(newTotalShown > 0 ? Math.round((newTotalCorrect / newTotalShown) * 100) : 0),
        }
      : null;

    return {
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      conceptTag: question.conceptTag,
      totalShown: newTotalShown,
      totalCorrect: newTotalCorrect,
      sessionComplete,
      nextQuestion,
      summary,
    };
  },

  async getSessionState(sessionId: string, studentId: string): Promise<{
    sessionId: string;
    subtopicId: string;
    sessionStatus: string;
    totalShown: number;
    totalCorrect: number;
    pendingRetriesCount: number;
    primaryRemaining: number;
    currentQuestion: NextQuestion | null;
  }> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
    });
    if (!session) throw new AppError(404, "Session not found");

    const pool = session.questionPool as unknown as PoolQuestion[];
    const shownQuestions = session.shownQuestions as unknown as number[];
    const pendingRetries = session.pendingRetries as unknown as number[];

    const currentQuestion =
      session.sessionStatus === "active"
        ? resolveNextQuestion(pool, shownQuestions, pendingRetries, session.totalShown)
        : null;

    const primaryRemaining = [0, 1, 2, 3, 4].filter((i) => !shownQuestions.includes(i)).length;

    return {
      sessionId,
      subtopicId: session.subtopicId,
      sessionStatus: session.sessionStatus,
      totalShown: session.totalShown,
      totalCorrect: session.totalCorrect,
      pendingRetriesCount: pendingRetries.length,
      primaryRemaining,
      currentQuestion,
    };
  },

  async submitQuiz(input: SubmitQuizInput) {
    const { studentId, sessionId, answers } = input;

    if (!answers || answers.length !== 5) {
      throw new AppError(400, "Exactly 5 answers required");
    }
    if (answers.some((a) => a < 0 || a > 3)) {
      throw new AppError(400, "Each answer must be 0-3");
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { subtopic: true },
    });
    if (!session) throw new AppError(404, "Session not found");

    const existing = await prisma.quizAttempt.findUnique({ where: { sessionId } });
    if (existing) throw new AppError(409, "Session already attempted");

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

    await prisma.quizAttempt.create({
      data: {
        studentId,
        sessionId,
        score,
        total,
        answers: answerResults as unknown as Prisma.InputJsonValue,
      },
    });

    const pool = session.questionPool as unknown as PoolQuestion[];
    const poolByIndex = new Map(pool.map((q) => [q.index, q]));

    await Promise.all(
      answerResults.map((a, i) => {
        const poolQ = poolByIndex.get(i);
        if (!poolQ) return Promise.resolve();
        const conceptId = `${session.subtopicId}_${poolQ.conceptTag}`;
        return conceptService.updateConceptMastery(studentId, conceptId, a.isCorrect, a.cognitiveLevel, poolQ.difficulty);
      }),
    );

    const masteryResult = await subtopicService.updateSubtopicMastery(
      studentId,
      session.subtopicId,
    );

    const driver = getDriver();
    const neo4jSession = driver.session();
    const knowledgeGaps: Array<{ topicId: string; topicName: string; mastery: number }> = [];

    try {
      const gapResult = await neo4jSession.run(
        `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
         WITH prereq, coalesce(k.mastery, 0.0) AS m
         WHERE m < 0.5
         RETURN prereq.id AS id, prereq.name AS name, m AS mastery`,
        { topicId: session.subtopic.topicId, studentId },
      );
      for (const r of gapResult.records) {
        knowledgeGaps.push({
          topicId: r.get("id") as string,
          topicName: r.get("name") as string,
          mastery: Number(r.get("mastery")),
        });
      }
    } finally {
      await neo4jSession.close();
    }

    const message = getMessage(percentage, session.subtopic.name, masteryResult.trend);

    return {
      score,
      total,
      percentage,
      grade: getGrade(percentage),
      answerResults,
      subtopicResult: {
        subtopicId: session.subtopicId,
        subtopicName: session.subtopic.name,
        subtopicOrder: session.subtopic.order,
        previousMastery: masteryResult.previousMastery,
        newMastery: masteryResult.newMastery,
        isComplete: masteryResult.isComplete,
        justCompleted: masteryResult.justCompleted,
        trend: masteryResult.trend,
        nextSubtopicId: masteryResult.nextSubtopicId,
        chapterMastery: masteryResult.chapterMastery,
      },
      knowledgeGaps,
      message,
    };
  },

  async getAttempt(sessionId: string, studentId: string) {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { sessionId, studentId },
      include: { session: { include: { subtopic: true } } },
    });
    if (!attempt) throw new AppError(404, "Attempt not found");
    return attempt;
  },
};
