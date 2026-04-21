import { Router } from "express";
import { subtopicController } from "../controllers/subtopic.controller";

const router = Router();

router.get("/topics", subtopicController.getTopics);
router.get("/all-progress", subtopicController.getAllChaptersProgress);
router.get("/:subtopicId/concepts", subtopicController.getConcepts);
router.get("/:studentId/review-due", subtopicController.getReviewDue);
router.get("/:topicId/progress", subtopicController.getChapterProgress);
router.get("/:topicId/current", subtopicController.getCurrentSubtopic);

export default router;
