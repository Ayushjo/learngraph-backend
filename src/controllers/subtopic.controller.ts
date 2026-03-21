import { Request, Response, NextFunction } from "express";
import { subtopicService } from "../services/subtopics.service";
import { AppError } from "../middleware/errorHandler";
import { TOPICS } from "../data/subtopics";

export const subtopicController = {
  // GET /api/subtopics/topics?subject=Chemistry&classLevel=12
  // Get all chapters with their subtopic list (no mastery — just structure)
  async getTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      if (!subject) throw new AppError(400, "subject is required");

      const topics = TOPICS.filter(
        (t) =>
          t.subject === subject &&
          (classLevel ? t.classLevel === classLevel : true),
      ).map((t) => ({
        id: t.id,
        name: t.name,
        classLevel: t.classLevel,
        subject: t.subject,
        totalSubtopics: t.subtopics.length,
      }));

      res.status(200).json({ success: true, data: topics });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/subtopics/:topicId/progress?studentId=xxx
  // Full chapter progress for a student — which subtopics done, locked, current
  async getChapterProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const studentId = req.query.studentId as string;

      if (!studentId) throw new AppError(400, "studentId is required");

      const progress = await subtopicService.getChapterProgress(
        studentId,
        topicId,
      );

      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/subtopics/:topicId/current?studentId=xxx
  // Get the current subtopic for a student in a chapter
  async getCurrentSubtopic(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const studentId = req.query.studentId as string;

      if (!studentId) throw new AppError(400, "studentId is required");

      const progress = await subtopicService.getChapterProgress(
        studentId,
        topicId,
      );

      const current =
        progress.subtopics.find((s) => s.isCurrent) ??
        progress.subtopics.find((s) => s.isUnlocked && !s.isComplete) ??
        progress.subtopics[0]; // fallback to first

      res.status(200).json({
        success: true,
        data: {
          current,
          chapterProgress: {
            totalSubtopics: progress.totalSubtopics,
            completedSubtopics: progress.completedSubtopics,
            chapterMastery: progress.chapterMastery,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/subtopics/all-progress?studentId=xxx&subject=Chemistry&classLevel=12
  // All chapters progress for dashboard
  async getAllChaptersProgress(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const studentId = req.query.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      if (!studentId) throw new AppError(400, "studentId is required");
      if (!subject) throw new AppError(400, "subject is required");

      const progress = await subtopicService.getAllChaptersProgress(
        studentId,
        subject,
        classLevel,
      );

      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },
};
