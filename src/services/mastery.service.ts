import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";

const getMasteryLevel = (mastery: number, attempts: number) => {
  if (attempts === 0) return "not_started";
  if (mastery < 0.4) return "struggling";
  if (mastery < 0.6) return "developing";
  if (mastery < 0.8) return "proficient";
  return "mastered";
};

export const masteryService = {
  async getTopicMastery(studentId: string, topicId: string) {
    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (t:Topic {id: $topicId})
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
         RETURN
           t.id         AS topicId,
           t.name       AS topicName,
           t.classLevel AS classLevel,
           coalesce(k.mastery, 0.0)  AS mastery,
           coalesce(k.attempts, 0)   AS attempts,
           k.trend         AS trend,
           k.lastAttempted AS lastAttempted`,
        { studentId, topicId },
      );

      if (result.records.length === 0) {
        throw new AppError(404, "Topic not found");
      }

      const r = result.records[0];
      const mastery = Number(r.get("mastery"));
      const attempts = Number(r.get("attempts"));

      return {
        topicId: r.get("topicId") as string,
        topicName: r.get("topicName") as string,
        classLevel: Number(r.get("classLevel")),
        mastery,
        attempts,
        trend: r.get("trend") as string | null,
        lastAttempted: r.get("lastAttempted") as string | null,
        masteryLevel: getMasteryLevel(mastery, attempts),
      };
    } finally {
      await session.close();
    }
  },
};
