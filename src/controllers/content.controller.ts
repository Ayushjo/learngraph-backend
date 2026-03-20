import { Request, Response, NextFunction } from "express";
import { contentService } from "../services/content.service";
import { AppError } from "../middleware/errorHandler";

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

      const result = await contentService.generatePassageAndQuestions(
        studentId,
        topicId,
        topicName,
        subject,
        classLevel,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
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
