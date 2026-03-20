import { Router } from "express";
import { quizController } from "../controllers/quiz.controller";

const router = Router();

// POST /api/quiz/submit
router.post("/submit", quizController.submit);

// GET /api/quiz/attempt/:sessionId?studentId=xxx
router.get("/attempt/:sessionId", quizController.getAttempt);

export default router;
