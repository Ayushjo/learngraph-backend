import { Router } from "express";
import { subtopicController } from "../controllers/subtopic.controller";

const router = Router();

// GET /api/subtopics/topics?subject=Chemistry&classLevel=12
router.get("/topics", subtopicController.getTopics);

// GET /api/subtopics/all-progress?studentId=xxx&subject=Chemistry
router.get("/all-progress", subtopicController.getAllChaptersProgress);

// GET /api/subtopics/:topicId/progress?studentId=xxx
router.get("/:topicId/progress", subtopicController.getChapterProgress);

// GET /api/subtopics/:topicId/current?studentId=xxx
router.get("/:topicId/current", subtopicController.getCurrentSubtopic);

export default router;
