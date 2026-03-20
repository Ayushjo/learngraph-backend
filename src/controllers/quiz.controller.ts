import { Request, Response, NextFunction } from "express";
import { quizService } from "../services/quiz.service";
import { AppError } from "../middleware/errorHandler";

export const quizController = {
  // POST /api/quiz/submit
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, sessionId, answers } = req.body;

      if (!studentId || !sessionId || !answers) {
        throw new AppError(
          400,
          "studentId, sessionId and answers are required",
        );
      }

      const result = await quizService.submitQuiz({
        studentId,
        sessionId,
        answers,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/quiz/attempt/:sessionId?studentId=xxx
  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.query.studentId as string;

      if (!studentId) {
        throw new AppError(400, "studentId query param is required");
      }

      const attempt = await quizService.getAttempt(sessionId, studentId);

      res.status(200).json({
        success: true,
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  },
};
