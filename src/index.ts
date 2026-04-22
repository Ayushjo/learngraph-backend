import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { verifyNeo4jConnection, closeDriver } from "./db/neo4j";
import { prisma } from "./db/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { startQualityJob, stopQualityJob } from "./jobs/quality.job";

import studentRoutes from "./routes/students";
import contentRoutes from "./routes/content";
import quizRoutes from "./routes/quiz";
import graphRoutes from "./routes/graph";
import subtopicRoutes from "./routes/subtopics";

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/students", studentRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/subtopics", subtopicRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Postgres connected");
  } catch (error) {
    console.error("Failed to connect to Postgres:", error);
    process.exit(1);
  }

  verifyNeo4jConnection().catch((error) => {
    console.warn("⚠️  Neo4j unavailable — graph endpoints will fail until connection is restored:", (error as Error).message);
  });

  startQualityJob();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });

  process.on("SIGTERM", async () => {
    stopQualityJob();
    server.close();
    await closeDriver();
    await prisma.$disconnect();
  });
};

start();

export default app;
