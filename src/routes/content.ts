import { Router } from "express";
import { contentController } from "../controllers/content.controller";
import { contentGenerationLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/generate", contentGenerationLimiter, contentController.generate);
router.get("/generation-stats", contentController.getGenerationStats);
router.get("/session/:sessionId", contentController.getSession);

export default router;
