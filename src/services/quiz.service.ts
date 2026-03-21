import { prisma } from "../db/prisma";
import { subtopicService } from "./subtopics.service";
import { AppError } from "../middleware/errorHandler";
import { Prisma } from "@prisma/client";
import { getDriver } from "../db/neo4j";

export interface SubmitQuizInput {
  studentId: string;
  sessionId: string;
  answers: number[];
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

const getGrade = (pct: number): string => {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs Practice";
  return "Keep Trying";
};

const getMessage = (pct: number, name: string, trend: string): string => {
  if (pct === 100) return `Perfect score on ${name}! Subtopic complete.`;
  if (pct >= 60 && trend === "improving")
    return `${name} complete! Moving to the next subtopic.`;
  if (pct >= 60) return `Good work — ${name} is now complete!`;
  if (pct >= 40)
    return `Getting there on ${name}. One more attempt should do it.`;
  return `${name} needs more practice. Try again with a fresh passage.`;
};

export const quizService = {
  async submitQuiz(input: SubmitQuizInput) {
    const { studentId, sessionId, answers } = input;

    if (!answers || answers.length !== 5) {
      throw new AppError(400, "Exactly 5 answers required");
    }
    if (answers.some((a) => a < 0 || a > 3)) {
      throw new AppError(400, "Each answer must be 0-3");
    }

    // Fetch session
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { subtopic: true },
    });
    if (!session) throw new AppError(404, "Session not found");

    // Check not already attempted
    const existing = await prisma.quizAttempt.findUnique({
      where: { sessionId },
    });
    if (existing) throw new AppError(409, "Session already attempted");

    // Score answers
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

    // Save attempt
    await prisma.quizAttempt.create({
      data: {
        studentId,
        sessionId,
        score,
        total,
        answers: answerResults as unknown as Prisma.InputJsonValue,
      },
    });

    // Update subtopic mastery
    const masteryResult = await subtopicService.updateSubtopicMastery(
      studentId,
      session.subtopicId,
      score,
      total,
    );
    // After masteryResult calculation, add gap detection
    const driver = getDriver();
    const neo4jSession = driver.session();
    const knowledgeGaps: Array<{
      topicId: string;
      topicName: string;
      mastery: number;
    }> = [];

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

    const message = getMessage(
      percentage,
      session.subtopic.name,
      masteryResult.trend,
    );

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
