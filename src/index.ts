import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { verifyNeo4jConnection, closeDriver } from "./db/neo4j";
import { prisma } from "./db/prisma";
import { errorHandler } from "./middleware/errorHandler";

// Route imports (we'll fill these in next)
import studentRoutes from "./routes/students";
import contentRoutes from "./routes/content";
import quizRoutes from "./routes/quiz";
import graphRoutes from "./routes/graph";
import subtopicRoutes from "./routes/subtopics"
const app = express();

// Middleware
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/subtopics", subtopicRoutes);
// Error handler — must be last
app.use(errorHandler);

// Startup
const start = async () => {
  try {
    await verifyNeo4jConnection();
    await prisma.$connect();
    console.log("✅ Postgres connected");

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down...");
      server.close();
      await closeDriver();
      await prisma.$disconnect();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
