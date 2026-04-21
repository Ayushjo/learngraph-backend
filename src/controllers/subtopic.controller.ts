import { Request, Response, NextFunction } from "express";
import { subtopicService } from "../services/subtopics.service";
import { conceptService } from "../services/concept.service";
import { AppError } from "../middleware/errorHandler";
import { TOPICS } from "../data/subtopics";

export const subtopicController = {
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

  async getChapterProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const studentId = req.query.studentId as string;
      if (!studentId) throw new AppError(400, "studentId is required");
      const progress = await subtopicService.getChapterProgress(studentId, topicId);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentSubtopic(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const studentId = req.query.studentId as string;
      if (!studentId) throw new AppError(400, "studentId is required");

      const progress = await subtopicService.getChapterProgress(studentId, topicId);
      const current =
        progress.subtopics.find((s) => s.isCurrent) ??
        progress.subtopics.find((s) => s.isUnlocked && !s.isComplete) ??
        progress.subtopics[0];

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

  async getAllChaptersProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.query.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      if (!studentId) throw new AppError(400, "studentId is required");
      if (!subject) throw new AppError(400, "subject is required");

      const progress = await subtopicService.getAllChaptersProgress(studentId, subject, classLevel);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  async getConcepts(req: Request, res: Response, next: NextFunction) {
    try {
      const subtopicId = req.params.subtopicId as string;
      const studentId = req.query.studentId as string;
      if (!studentId) throw new AppError(400, "studentId query param is required");
      const concepts = await conceptService.getConceptsForSubtopic(studentId, subtopicId);
      res.status(200).json({ success: true, data: concepts });
    } catch (error) {
      next(error);
    }
  },

  async getReviewDue(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const concepts = await conceptService.getDueForReview(studentId);
      res.status(200).json({ success: true, data: concepts });
    } catch (error) {
      next(error);
    }
  },
};
