import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";
import neo4j from "neo4j-driver";

export interface GraphNode {
  id: string;
  name: string;
  subject: string;
  classLevel: number;
  mastery: number;
  attempts: number;
  trend: "improving" | "declining" | "stable" | null;
  lastAttempted: string | null;
  masteryLevel:
    | "struggling"
    | "developing"
    | "proficient"
    | "mastered"
    | "not_started";
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "REQUIRES" | "RELATED_TO";
}

export interface StudentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalTopics: number;
    attempted: number;
    mastered: number;
    struggling: number;
    averageMastery: number;
  };
}

const getMasteryLevel = (
  mastery: number,
  attempts: number,
): GraphNode["masteryLevel"] => {
  if (attempts === 0) return "not_started";
  if (mastery < 0.4) return "struggling";
  if (mastery < 0.6) return "developing";
  if (mastery < 0.8) return "proficient";
  return "mastered";
};

export const neo4jService = {
  async getStudentGraph(studentId: string): Promise<StudentGraph> {
    const driver = getDriver();
    const session = driver.session();

    try {
      const nodesResult = await session.run(
        `MATCH (t:Topic)
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
         RETURN
           t.id            AS id,
           t.name          AS name,
           t.subject       AS subject,
           t.classLevel    AS classLevel,
           coalesce(k.mastery, 0.0)   AS mastery,
           coalesce(k.attempts, 0)    AS attempts,
           k.trend         AS trend,
           k.lastAttempted AS lastAttempted
         ORDER BY t.classLevel ASC, t.name ASC`,
        { studentId },
      );

      const nodes: GraphNode[] = nodesResult.records.map((r) => {
        const mastery = Number(r.get("mastery"));
        const attempts = Number(r.get("attempts"));

        return {
          id: r.get("id") as string,
          name: r.get("name") as string,
          subject: r.get("subject") as string,
          classLevel: Number(r.get("classLevel")),
          mastery,
          attempts,
          trend: r.get("trend") as GraphNode["trend"],
          lastAttempted: r.get("lastAttempted") as string | null,
          masteryLevel: getMasteryLevel(mastery, attempts),
        };
      });

      const edgesResult = await session.run(
        `MATCH (a:Topic)-[r:REQUIRES|RELATED_TO]->(b:Topic)
         RETURN
           a.id AS source,
           b.id AS target,
           type(r) AS type`,
      );

      const edges: GraphEdge[] = edgesResult.records.map((r) => ({
        source: r.get("source") as string,
        target: r.get("target") as string,
        type: r.get("type") as GraphEdge["type"],
      }));

      const attempted = nodes.filter((n) => n.attempts > 0);
      const mastered = nodes.filter((n) => n.masteryLevel === "mastered");
      const struggling = nodes.filter((n) => n.masteryLevel === "struggling");
      const averageMastery =
        attempted.length > 0
          ? attempted.reduce((sum, n) => sum + n.mastery, 0) / attempted.length
          : 0;

      return {
        nodes,
        edges,
        stats: {
          totalTopics: nodes.length,
          attempted: attempted.length,
          mastered: mastered.length,
          struggling: struggling.length,
          averageMastery: Math.round(averageMastery * 100) / 100,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        `Failed to fetch student graph: ${(error as Error).message}`,
      );
    } finally {
      await session.close();
    }
  },

  async getFilteredGraph(
    studentId: string,
    subject: string,
    classLevel?: number,
  ): Promise<StudentGraph> {
    const driver = getDriver();
    const session = driver.session();

    try {
      const whereClause = classLevel
        ? "WHERE t.subject = $subject AND t.classLevel = $classLevel"
        : "WHERE t.subject = $subject";

      const nodesResult = await session.run(
        `MATCH (t:Topic)
         ${whereClause}
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
         RETURN
           t.id            AS id,
           t.name          AS name,
           t.subject       AS subject,
           t.classLevel    AS classLevel,
           coalesce(k.mastery, 0.0)   AS mastery,
           coalesce(k.attempts, 0)    AS attempts,
           k.trend         AS trend,
           k.lastAttempted AS lastAttempted
         ORDER BY t.classLevel ASC, t.name ASC`,
        { studentId, subject, classLevel: classLevel ?? null },
      );

      const nodes: GraphNode[] = nodesResult.records.map((r) => {
        const mastery = Number(r.get("mastery"));
        const attempts = Number(r.get("attempts"));

        return {
          id: r.get("id") as string,
          name: r.get("name") as string,
          subject: r.get("subject") as string,
          classLevel: Number(r.get("classLevel")),
          mastery,
          attempts,
          trend: r.get("trend") as GraphNode["trend"],
          lastAttempted: r.get("lastAttempted") as string | null,
          masteryLevel: getMasteryLevel(mastery, attempts),
        };
      });

      const nodeIds = nodes.map((n) => n.id);

      const edgesResult = await session.run(
        `MATCH (a:Topic)-[r:REQUIRES|RELATED_TO]->(b:Topic)
         WHERE a.id IN $nodeIds AND b.id IN $nodeIds
         RETURN
           a.id AS source,
           b.id AS target,
           type(r) AS type`,
        { nodeIds },
      );

      const edges: GraphEdge[] = edgesResult.records.map((r) => ({
        source: r.get("source") as string,
        target: r.get("target") as string,
        type: r.get("type") as GraphEdge["type"],
      }));

      const attempted = nodes.filter((n) => n.attempts > 0);
      const mastered = nodes.filter((n) => n.masteryLevel === "mastered");
      const struggling = nodes.filter((n) => n.masteryLevel === "struggling");
      const averageMastery =
        attempted.length > 0
          ? attempted.reduce((sum, n) => sum + n.mastery, 0) / attempted.length
          : 0;

      return {
        nodes,
        edges,
        stats: {
          totalTopics: nodes.length,
          attempted: attempted.length,
          mastered: mastered.length,
          struggling: struggling.length,
          averageMastery: Math.round(averageMastery * 100) / 100,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        `Failed to fetch filtered graph: ${(error as Error).message}`,
      );
    } finally {
      await session.close();
    }
  },

  async getRecommendedTopics(
    studentId: string,
    subject: string,
    limit: number = 3,
    classLevel: number = 12,
  ) {
    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (t:Topic {subject: $subject, classLevel: $classLevel})
       OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
       WITH t,
            coalesce(k.mastery, 0.0) AS mastery,
            coalesce(k.attempts, 0)  AS attempts
       WHERE mastery < 0.8
       RETURN
         t.id         AS id,
         t.name       AS name,
         t.classLevel AS classLevel,
         mastery,
         attempts
       ORDER BY attempts DESC, mastery DESC
       LIMIT $limit`,
        {
          studentId,
          subject,
          classLevel: neo4j.int(classLevel),
          limit: neo4j.int(limit),
        },
      );

      return result.records.map((r) => ({
        id: r.get("id") as string,
        name: r.get("name") as string,
        classLevel: Number(r.get("classLevel")),
        mastery: Number(r.get("mastery")),
        attempts: Number(r.get("attempts")),
        masteryLevel: getMasteryLevel(
          Number(r.get("mastery")),
          Number(r.get("attempts")),
        ),
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        `Failed to fetch recommendations: ${(error as Error).message}`,
      );
    } finally {
      await session.close();
    }
  },
};
