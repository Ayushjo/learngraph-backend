import { Router } from "express";
import { graphController } from "../controllers/graph.controller";

const router = Router();

// GET /api/graph/:studentId
router.get("/:studentId", graphController.getStudentGraph);

// GET /api/graph/:studentId/filtered?subject=Science&classLevel=9
router.get("/:studentId/filtered", graphController.getFilteredGraph);

// GET /api/graph/:studentId/recommendations?subject=Science
router.get("/:studentId/recommendations", graphController.getRecommendations);

// GET /api/graph/:studentId/topic/:topicId
router.get("/:studentId/topic/:topicId", graphController.getTopicMastery);

export default router;
