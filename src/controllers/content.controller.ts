import { Request, Response, NextFunction } from "express";
import { contentService } from "../services/content.service";
import { subtopicService } from "../services/subtopics.service";
import { AppError } from "../middleware/errorHandler";

export const contentController = {
  // POST /api/content/generate
  // Body: { studentId, subtopicId }
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, subtopicId } = req.body;

      if (!studentId || !subtopicId) {
        throw new AppError(400, "studentId and subtopicId are required");
      }

      // Get student context from subtopic service
      const studentContext = await subtopicService.getStudentContextForSubtopic(
        studentId,
        subtopicId,
      );

      const result = await contentService.generatePassageAndQuestions(
        studentId,
        subtopicId,
        studentContext,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/content/session/:sessionId?studentId=xxx
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.query.studentId as string;

      if (!studentId) throw new AppError(400, "studentId is required");

      const session = await contentService.getSession(sessionId, studentId);

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },
};
