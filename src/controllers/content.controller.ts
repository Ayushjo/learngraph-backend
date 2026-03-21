import { Request, Response, NextFunction } from "express";
import { contentService } from "../services/content.service";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../db/prisma";
export const contentController = {
  // POST /api/content/generate
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, topicId, topicName, subject, classLevel } = req.body;

      if (!studentId || !topicName || !subject || !classLevel) {
        throw new AppError(
          400,
          "studentId, topicName, subject and classLevel are required",
        );
      }

      // Check if student has attempted this topic before
      const previousSession = await prisma.session.findFirst({
        where: { studentId, neo4jTopicId: topicId },
        include: { quizAttempt: true },
        orderBy: { createdAt: "desc" },
      });
      // Get the actual wrong questions from last attempt

      const wrongQuestions = previousSession?.quizAttempt
        ? (
            previousSession.quizAttempt.answers as Array<{
              cognitiveLevel: string;
              isCorrect: boolean;
              question: string;
            }>
          )
            .filter((a) => !a.isCorrect)
            .map((a) => a.cognitiveLevel)
        : [];
      let studentContext;
      if (previousSession?.quizAttempt) {
        // Student has attempted this topic — build context
        const answers = previousSession.quizAttempt.answers as Array<{
          cognitiveLevel: string;
          isCorrect: boolean;
        }>;

        const weakLevels = Object.entries(
          answers.reduce(
            (acc, a) => {
              if (!acc[a.cognitiveLevel])
                acc[a.cognitiveLevel] = { correct: 0, total: 0 };
              acc[a.cognitiveLevel].total++;
              if (a.isCorrect) acc[a.cognitiveLevel].correct++;
              return acc;
            },
            {} as Record<string, { correct: number; total: number }>,
          ),
        )
          .filter(([, stats]) => stats.correct / stats.total < 0.5)
          .map(([level]) => level);

        // Get prereq gaps from Neo4j
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
            { topicId, studentId },
          );
          for (const record of gapResult.records) {
            prereqGaps.push(record.get("name") as string);
          }
        } finally {
          await neo4jSession.close();
        }

        studentContext = {
          previousAttempts: await prisma.session.count({
            where: { studentId, neo4jTopicId: topicId },
          }),
          previousMastery:
            previousSession.quizAttempt.score /
            previousSession.quizAttempt.total,
          weakCognitiveLevels: weakLevels,
          prerequisiteGaps: prereqGaps,
        };
      }

      const result = await contentService.generatePassageAndQuestions(
        studentId,
        topicId,
        topicName,
        subject,
        classLevel,
        studentContext,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/content/session/:sessionId
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.query.studentId as string;

      if (!studentId) {
        throw new AppError(400, "studentId query param is required");
      }

      const session = await contentService.getSession(sessionId, studentId);

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
};
