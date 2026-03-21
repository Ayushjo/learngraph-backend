import { Request, Response, NextFunction } from "express";
import { neo4jService } from "../services/neo4j.service";
import { masteryService } from "../services/mastery.service";
import { AppError } from "../middleware/errorHandler";

export const graphController = {
  // GET /api/graph/:studentId
  // Full knowledge graph for a student
  async getStudentGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const graph = await neo4jService.getStudentGraph(studentId);

      res.status(200).json({
        success: true,
        data: graph,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/graph/:studentId/filtered?subject=Science&classLevel=9
  // Filtered graph by subject and optional classLevel
  async getFilteredGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      if (!subject) {
        throw new AppError(400, "subject query param is required");
      }

      const graph = await neo4jService.getFilteredGraph(
        studentId,
        subject,
        classLevel,
      );

      res.status(200).json({
        success: true,
        data: graph,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/graph/:studentId/recommendations?subject=Science
  // What topics to study next
  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : 12;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

      if (!subject) throw new AppError(400, "subject is required");

      const recommendations = await neo4jService.getRecommendedTopics(
        studentId,
        subject,
        limit,
        classLevel,
      );

      res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/graph/:studentId/topic/:topicId
  // Mastery for a single topic
  async getTopicMastery(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const topicId = req.params.topicId as string;

      const mastery = await masteryService.getTopicMastery(studentId, topicId);

      res.status(200).json({
        success: true,
        data: mastery,
      });
    } catch (error) {
      next(error);
    }
  },
};
