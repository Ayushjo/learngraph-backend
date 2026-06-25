import { Request, Response, NextFunction } from "express";
import { contentService } from "../services/content.service";
import { subtopicService } from "../services/subtopics.service";
import { generationLogService } from "../services/generation-log.service";
import { AppError } from "../middleware/errorHandler";

export const contentController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    req.on("close", () => {
      res.end();
    });

    try {
      const { studentId, subtopicId } = req.body;
      if (!studentId || !subtopicId) {
        throw new AppError(400, "studentId and subtopicId are required");
      }

      send("status", { message: "Fetching your knowledge graph..." });

      const studentContext = await subtopicService.getStudentContextForSubtopic(
        studentId,
        subtopicId,
      );

      send("status", { message: "Analyzing concept gaps..." });
      send("status", { message: "Generating content..." });

      const result = await contentService.generatePassageAndQuestions(
        studentId,
        subtopicId,
        studentContext,
        (title, passage) => {
          send("passage", { title, passage });
        },
      );

      send("result", result);
      res.end();
    } catch (error) {
      send("error", { message: error instanceof AppError ? error.message : "Generation failed" });
      res.end();
    }
  },

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

  async getGenerationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const stats = await generationLogService.getDailyStats(days);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
