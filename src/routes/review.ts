import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { contentGenerationLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/review/:studentId/queue  — review queue with count + concepts
router.get("/:studentId/queue", reviewController.getQueue);

// POST /api/review/:studentId/session  — start a review session (SSE stream)
router.post("/:studentId/session", contentGenerationLimiter, reviewController.startSession);

export default router;
