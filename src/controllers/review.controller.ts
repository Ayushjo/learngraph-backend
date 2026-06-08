import { Request, Response, NextFunction } from "express";
import { conceptService } from "../services/concept.service";
import { contentService } from "../services/content.service";
import { AppError } from "../middleware/errorHandler";

export const reviewController = {
  /**
   * GET /api/review/:studentId/queue
   * Returns all concepts due for review, sorted by urgency (most overdue first).
   * Also returns a summary count per subtopic for the dashboard badge.
   */
  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const due = await conceptService.getDueForReview(studentId);
      const limited = due.slice(0, limit);

      // Badge summary per subtopic for the dashboard
      const bySubtopic: Record<string, number> = {};
      // (We don't have subtopicId on ConceptState, but we have conceptId)
      // Just return total count + top concepts for the review prompt

      res.status(200).json({
        success: true,
        data: {
          totalDue: due.length,
          concepts: limited.map((c) => ({
            conceptId:        c.conceptId,
            conceptName:      c.conceptName,
            tag:              c.tag,
            effectiveMastery: Math.round(c.effectiveMastery * 100),
            retentionScore:   Math.round(c.retentionScore * 100),
            overdueDays:      Math.round(c.overdueDays * 10) / 10,
            nextReviewDate:   c.nextReviewDate,
            halfLifeDays:     c.halfLifeDays,
            daysSinceAttempt: c.daysSinceAttempt ? Math.round(c.daysSinceAttempt) : null,
            consecutiveWrong: c.consecutiveWrong,
            velocity:         Math.round(c.velocity * 100) / 100,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/review/:studentId/session
   * Starts a new review session for the student's most urgent due concepts.
   * Body: { maxConcepts?: number }  (default 5 — keeps the session focused)
   */
  async startSession(req: Request, res: Response, next: NextFunction) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    req.on("close", () => res.end());

    try {
      const studentId = req.params.studentId as string;
      const maxConcepts: number = req.body?.maxConcepts ?? 5;

      send("status", { message: "Checking your review queue..." });

      const due = await conceptService.getDueForReview(studentId);

      if (due.length === 0) {
        send("error", { message: "No concepts are due for review right now." });
        res.end();
        return;
      }

      // Take the most urgent concepts, capped at maxConcepts
      const toReview = due.slice(0, Math.min(maxConcepts, due.length));

      send("status", {
        message: `Found ${due.length} concepts to review. Generating session for ${toReview.length}...`,
      });

      const result = await contentService.generateReviewSession(studentId, toReview);

      send("result", result);
      res.end();
    } catch (error) {
      send("error", {
        message: error instanceof AppError ? error.message : "Review session generation failed",
      });
      res.end();
    }
  },
};
