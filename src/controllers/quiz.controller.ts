import { Request, Response, NextFunction } from "express";
import { quizService } from "../services/quiz.service";
import { AppError } from "../middleware/errorHandler";

export const quizController = {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, sessionId, answers } = req.body;
      if (!studentId || !sessionId || !answers) {
        throw new AppError(400, "studentId, sessionId and answers are required");
      }
      const result = await quizService.submitQuiz({ studentId, sessionId, answers });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, sessionId, questionIndex, chosenAnswer } = req.body;
      if (!studentId || !sessionId || questionIndex === undefined || chosenAnswer === undefined) {
        throw new AppError(400, "studentId, sessionId, questionIndex and chosenAnswer are required");
      }
      if (typeof questionIndex !== "number" || typeof chosenAnswer !== "number") {
        throw new AppError(400, "questionIndex and chosenAnswer must be numbers");
      }
      const result = await quizService.submitAnswer({ studentId, sessionId, questionIndex, chosenAnswer });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getSessionState(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.id as string;
      const studentId = req.query.studentId as string;
      if (!studentId) throw new AppError(400, "studentId query param is required");
      const state = await quizService.getSessionState(sessionId, studentId);
      res.status(200).json({ success: true, data: state });
    } catch (error) {
      next(error);
    }
  },

  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.query.studentId as string;
      if (!studentId) throw new AppError(400, "studentId query param is required");
      const attempt = await quizService.getAttempt(sessionId, studentId);
      res.status(200).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  },
};
