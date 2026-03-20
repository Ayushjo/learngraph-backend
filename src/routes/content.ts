import { Router } from "express";
import { contentController } from "../controllers/content.controller";

const router = Router();

// POST /api/content/generate
router.post("/generate", contentController.generate);

// GET /api/content/session/:sessionId?studentId=xxx
router.get("/session/:sessionId", contentController.getSession);

export default router;
