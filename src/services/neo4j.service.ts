import { getDriver } from "../db/neo4j";
import { AppError } from "../middleware/errorHandler";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export const neo4jService = {
  // Fetch the full knowledge graph for a student
  // Returns all topic nodes with mastery data + all edges between them
  async getStudentGraph(studentId: string): Promise<StudentGraph> {
    const driver = getDriver();
    const session = driver.session();

    try {
      // ── Step 1: Get all topic nodes with student mastery overlaid ─────────
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
        const mastery = r.get("mastery") as number;
        const attempts = r.get("attempts") as number;

        return {
          id: r.get("id") as string,
          name: r.get("name") as string,
          subject: r.get("subject") as string,
          classLevel: r.get("classLevel") as number,
          mastery,
          attempts,
          trend: r.get("trend") as GraphNode["trend"],
          lastAttempted: r.get("lastAttempted") as string | null,
          masteryLevel: getMasteryLevel(mastery, attempts),
        };
      });

      // ── Step 2: Get all edges between topic nodes ─────────────────────────
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

      // ── Step 3: Compute stats ─────────────────────────────────────────────
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

  // Get graph filtered by subject and optional classLevel
  // Useful for frontend to show focused subgraph
  async getFilteredGraph(
    studentId: string,
    subject: string,
    classLevel?: number,
  ): Promise<StudentGraph> {
    const driver = getDriver();
    const session = driver.session();

    try {
      // Build dynamic WHERE clause
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
        const mastery = r.get("mastery") as number;
        const attempts = r.get("attempts") as number;

        return {
          id: r.get("id") as string,
          name: r.get("name") as string,
          subject: r.get("subject") as string,
          classLevel: r.get("classLevel") as number,
          mastery,
          attempts,
          trend: r.get("trend") as GraphNode["trend"],
          lastAttempted: r.get("lastAttempted") as string | null,
          masteryLevel: getMasteryLevel(mastery, attempts),
        };
      });

      // Get edges only between the filtered nodes
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
          averageMastery: Math.round(averageMastery * 100) / 10,
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

  // Get what topics to study next — topics whose prerequisites are sufficiently mastered
  async getRecommendedTopics(
    studentId: string,
    subject: string,
    limit: number = 3,
  ) {
    const driver = getDriver();
    const session = driver.session();

    try {
      // Find topics where:
      // 1. Student has not mastered them yet (mastery < 0.8)
      // 2. All prerequisites have mastery >= 0.5
      const result = await session.run(
        `MATCH (t:Topic {subject: $subject})
         OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(t)
         WITH t, coalesce(k.mastery, 0.0) AS topicMastery, coalesce(k.attempts, 0) AS attempts

         // Only topics not yet mastered
         WHERE topicMastery < 0.8

         // Check all prerequisites are sufficiently mastered
         OPTIONAL MATCH (t)-[:REQUIRES]->(prereq:Topic)
         OPTIONAL MATCH (s2:Student {id: $studentId})-[kp:KNOWS]->(prereq)
         WITH t, topicMastery, attempts,
              collect(prereq) AS prereqs,
              collect(coalesce(kp.mastery, 0.0)) AS prereqMasteries

         // Either no prerequisites OR all prerequisites mastery >= 0.5
         WHERE size(prereqs) = 0
            OR all(m IN prereqMasteries WHERE m >= 0.5)

         RETURN
           t.id          AS id,
           t.name        AS name,
           t.classLevel  AS classLevel,
           topicMastery  AS mastery,
           attempts      AS attempts
         ORDER BY t.classLevel ASC, topicMastery DESC
         LIMIT $limit`,
        { studentId, subject, limit },
      );

      return result.records.map((r) => ({
        id: r.get("id") as string,
        name: r.get("name") as string,
        classLevel: r.get("classLevel") as number,
        mastery: r.get("mastery") as number,
        attempts: r.get("attempts") as number,
        masteryLevel: getMasteryLevel(
          r.get("mastery") as number,
          r.get("attempts") as number,
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
