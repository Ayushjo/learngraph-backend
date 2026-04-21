import { Router } from "express";
import { graphController } from "../controllers/graph.controller";

const router = Router();

router.get("/:studentId", graphController.getStudentGraph);
router.get("/:studentId/filtered", graphController.getFilteredGraph);
router.get("/:studentId/recommendations", graphController.getRecommendations);
router.get("/:studentId/topic/:topicId", graphController.getTopicMastery);

export default router;
