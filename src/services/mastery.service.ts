import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MasteryUpdateInput {
  studentId: string;
  topicId: string; // Neo4j topic id (e.g. 'c9_fundamental_unit')
  score: number; // correct answers
  total: number; // total questions (always 5)
}

export interface MasteryResult {
  topicId: string;
  topicName: string;
  previousMastery: number;
  newMastery: number;
  attempts: number;
  trend: "improving" | "declining" | "stable";
  masteryLevel: "struggling" | "developing" | "proficient" | "mastered";
  prerequisiteBoosts: Array<{
    topicId: string;
    topicName: string;
    previousMastery: number;
    newMastery: number;
  }>;
  knowledgeGaps: Array<{
    topicId: string;
    topicName: string;
    mastery: number;
    masteryLevel: string;
  }>;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

// Learning rate decreases as attempts increase
const getLearningRate = (attempts: number): number => {
  if (attempts === 0) return 0.6; // first attempt — high weight
  if (attempts === 1) return 0.4; // second attempt — moderate weight
  return 0.3; // third attempt+ — lower weight
};

// Calculate new mastery using weighted update formula
const calculateNewMastery = (
  oldMastery: number,
  scorePercent: number,
  attempts: number,
): number => {
  const alpha = getLearningRate(attempts);
  const raw = oldMastery + alpha * (scorePercent - oldMastery);
  // Clamp between 0 and 1, round to 4 decimal places
  return Math.round(Math.min(1, Math.max(0, raw)) * 10000) / 10000;
};

// Determine trend based on score vs previous mastery
const getTrend = (
  scorePercent: number,
  previousMastery: number,
): "improving" | "declining" | "stable" => {
  if (scorePercent > previousMastery + 0.05) return "improving";
  if (scorePercent < previousMastery - 0.1) return "declining";
  return "stable";
};

// Determine mastery level label from score
const getMasteryLevel = (
  mastery: number,
): "struggling" | "developing" | "proficient" | "mastered" => {
  if (mastery < 0.4) return "struggling";
  if (mastery < 0.6) return "developing";
  if (mastery < 0.8) return "proficient";
  return "mastered";
};

// Calculate prerequisite boost — only if score > 50%
const getPrerequisiteBoost = (scorePercent: number): number => {
  if (scorePercent <= 0.5) return 0;
  // Max boost is 0.1
  return Math.min(0.1, (scorePercent - 0.5) * 0.15);
};

// ─── Main Service ─────────────────────────────────────────────────────────────

export const masteryService = {
  async updateMastery(input: MasteryUpdateInput): Promise<MasteryResult> {
    const { studentId, topicId, score, total } = input;
    const scorePercent = score / total;
    const driver = getDriver();
    const session = driver.session();

    try {
      // ── Step 1: Ensure Student node exists in Neo4j ──────────────────────
      await session.run(`MERGE (s:Student {id: $studentId})`, { studentId });

      // ── Step 2: Get current mastery for this topic ───────────────────────
      const currentMasteryResult = await session.run(
        `MATCH (s:Student {id: $studentId})
         MATCH (t:Topic {id: $topicId})
         OPTIONAL MATCH (s)-[k:KNOWS]->(t)
         RETURN 
           t.name AS topicName,
           coalesce(k.mastery, 0.0) AS mastery,
           coalesce(k.attempts, 0) AS attempts`,
        { studentId, topicId },
      );

      if (currentMasteryResult.records.length === 0) {
        throw new AppError(
          404,
          `Topic ${topicId} not found in knowledge graph`,
        );
      }

      const record = currentMasteryResult.records[0];
      const topicName = record.get("topicName") as string;
      const previousMastery = record.get("mastery") as number;
      const attempts = record.get("attempts") as number;

      // ── Step 3: Calculate new mastery ────────────────────────────────────
      const newMastery = calculateNewMastery(
        previousMastery,
        scorePercent,
        attempts,
      );
      const trend = getTrend(scorePercent, previousMastery);
      const masteryLevel = getMasteryLevel(newMastery);
      const newAttempts = attempts + 1;

      // ── Step 4: Update or create KNOWS relationship in Neo4j ─────────────
      await session.run(
        `MATCH (s:Student {id: $studentId})
         MATCH (t:Topic {id: $topicId})
         MERGE (s)-[k:KNOWS]->(t)
         SET k.mastery = $newMastery,
             k.attempts = $newAttempts,
             k.lastAttempted = $lastAttempted,
             k.trend = $trend`,
        {
          studentId,
          topicId,
          newMastery,
          newAttempts,
          lastAttempted: new Date().toISOString(),
          trend,
        },
      );

      // ── Step 5: Propagate partial credit to direct prerequisites ─────────
      const boost = getPrerequisiteBoost(scorePercent);
      const prerequisiteBoosts: MasteryResult["prerequisiteBoosts"] = [];

      if (boost > 0) {
        // Get all direct prerequisites of this topic
        const prereqResult = await session.run(
          `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
           OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
           RETURN 
             prereq.id AS prereqId,
             prereq.name AS prereqName,
             coalesce(k.mastery, 0.0) AS prereqMastery,
             coalesce(k.attempts, 0) AS prereqAttempts`,
          { topicId, studentId },
        );

        for (const prereqRecord of prereqResult.records) {
          const prereqId = prereqRecord.get("prereqId") as string;
          const prereqName = prereqRecord.get("prereqName") as string;
          const prereqMastery = prereqRecord.get("prereqMastery") as number;
          const prereqAttempts = prereqRecord.get("prereqAttempts") as number;

          // Only boost if prerequisite hasn't been mastered already
          if (prereqMastery < 0.8) {
            const boostedMastery = Math.min(
              0.8, // prerequisite boost can never push above 0.8 — must be earned directly
              Math.round((prereqMastery + boost) * 10000) / 10000,
            );

            await session.run(
              `MATCH (s:Student {id: $studentId})
               MATCH (prereq:Topic {id: $prereqId})
               MERGE (s)-[k:KNOWS]->(prereq)
               SET k.mastery = $boostedMastery,
                   k.attempts = $prereqAttempts,
                   k.lastAttempted = $lastAttempted,
                   k.trend = 'improving'`,
              {
                studentId,
                prereqId,
                boostedMastery,
                prereqAttempts,
                lastAttempted: new Date().toISOString(),
              },
            );

            prerequisiteBoosts.push({
              topicId: prereqId,
              topicName: prereqName,
              previousMastery: prereqMastery,
              newMastery: boostedMastery,
            });
          }
        }
      }

      // ── Step 6: Detect knowledge gaps in prerequisites ───────────────────
      const gapResult = await session.run(
        `MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
         WITH prereq, coalesce(k.mastery, 0.0) AS prereqMastery
         WHERE prereqMastery < 0.5
         RETURN 
           prereq.id AS prereqId,
           prereq.name AS prereqName,
           prereqMastery`,
        { topicId, studentId },
      );

      const knowledgeGaps: MasteryResult["knowledgeGaps"] =
        gapResult.records.map((gapRecord) => ({
          topicId: gapRecord.get("prereqId") as string,
          topicName: gapRecord.get("prereqName") as string,
          mastery: gapRecord.get("prereqMastery") as number,
          masteryLevel: getMasteryLevel(
            gapRecord.get("prereqMastery") as number,
          ),
        }));

      return {
        topicId,
        topicName,
        previousMastery,
        newMastery,
        attempts: newAttempts,
        trend,
        masteryLevel,
        prerequisiteBoosts,
        knowledgeGaps,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        `Mastery update failed: ${(error as Error).message}`,
      );
    } finally {
      await session.close();
    }
  },

  // Get mastery for a single topic for a student
  async getTopicMastery(studentId: string, topicId: string) {
    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (t:Topic {id: $topicId})
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
         RETURN
           t.id AS topicId,
           t.name AS topicName,
           t.classLevel AS classLevel,
           coalesce(k.mastery, 0.0) AS mastery,
           coalesce(k.attempts, 0) AS attempts,
           k.trend AS trend,
           k.lastAttempted AS lastAttempted`,
        { studentId, topicId },
      );

      if (result.records.length === 0) {
        throw new AppError(404, "Topic not found");
      }

      const r = result.records[0];
      return {
        topicId: r.get("topicId"),
        topicName: r.get("topicName"),
        classLevel: r.get("classLevel"),
        mastery: r.get("mastery"),
        attempts: r.get("attempts"),
        trend: r.get("trend"),
        lastAttempted: r.get("lastAttempted"),
        masteryLevel: getMasteryLevel(r.get("mastery")),
      };
    } finally {
      await session.close();
    }
  },
};
