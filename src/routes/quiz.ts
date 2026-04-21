import { Router } from "express";
import { quizController } from "../controllers/quiz.controller";

const router = Router();

router.post("/submit", quizController.submit);
router.post("/answer", quizController.answer);
router.get("/session/:id/state", quizController.getSessionState);
router.get("/attempt/:sessionId", quizController.getAttempt);

export default router;
