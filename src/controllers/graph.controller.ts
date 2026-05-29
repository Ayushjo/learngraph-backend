import { Request, Response, NextFunction } from "express";
import { neo4jService } from "../services/neo4j.service";
import { masteryService } from "../services/mastery.service";
import { conceptService, MemoryConceptState, MemoryState } from "../services/concept.service";
import { AppError } from "../middleware/errorHandler";
import { TOPICS } from "../data/subtopics";
import { prisma } from "../db/prisma";

const MEMORY_STATES: MemoryState[] = [
  "new_exposure",
  "fragile",
  "stabilizing",
  "durable",
];

export const graphController = {
  async getStudentGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const graph = await neo4jService.getStudentGraph(studentId);
      res.status(200).json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  },

  async getFilteredGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      if (!subject) throw new AppError(400, "subject query param is required");

      const graph = await neo4jService.getFilteredGraph(studentId, subject, classLevel);
      res.status(200).json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  },

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : 12;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

      if (!subject) throw new AppError(400, "subject is required");

      const recommendations = await neo4jService.getRecommendedTopics(
        studentId,
        subject,
        limit,
        classLevel,
      );
      res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  },

  async getTopicMastery(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const topicId = req.params.topicId as string;
      const mastery = await masteryService.getTopicMastery(studentId, topicId);
      res.status(200).json({ success: true, data: mastery });
    } catch (error) {
      next(error);
    }
  },

  async getMemoryProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string | undefined;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;
      const conceptLimit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 12;

      const concepts = await conceptService.getMemorySignalsForStudent(studentId, {
        subject,
        classLevel,
      });

      const safeLimit = Number.isFinite(conceptLimit)
        ? Math.max(1, Math.min(50, conceptLimit))
        : 12;
      const topConcepts = concepts.slice(0, safeLimit);

      const byTopic = new Map<
        string,
        {
          topicId: string;
          topicName: string;
          subject: string;
          classLevel: number;
          totalConcepts: number;
          averageForgetRisk: number;
          averageEffectiveMastery: number;
          memoryStateCounts: Record<MemoryState, number>;
          concepts: MemoryConceptState[];
        }
      >();

      for (const c of concepts) {
        const topic = TOPICS.find((t) => t.id === c.topicId);
        const topicName = topic?.name ?? c.topicId;

        const row = byTopic.get(c.topicId) ?? {
          topicId: c.topicId,
          topicName,
          subject: c.subject,
          classLevel: c.classLevel,
          totalConcepts: 0,
          averageForgetRisk: 0,
          averageEffectiveMastery: 0,
          memoryStateCounts: {
            new_exposure: 0,
            fragile: 0,
            stabilizing: 0,
            durable: 0,
          },
          concepts: [],
        };

        row.totalConcepts += 1;
        row.averageForgetRisk += c.forgetRiskScore;
        row.averageEffectiveMastery += c.effectiveMastery;
        row.memoryStateCounts[c.memoryState] += 1;
        row.concepts.push(c);

        byTopic.set(c.topicId, row);
      }

      const regions = Array.from(byTopic.values())
        .map((row) => {
          const avgRisk =
            row.totalConcepts > 0 ? row.averageForgetRisk / row.totalConcepts : 0;
          const avgMastery =
            row.totalConcepts > 0 ? row.averageEffectiveMastery / row.totalConcepts : 0;

          const dominantState = MEMORY_STATES.reduce((best, state) =>
            row.memoryStateCounts[state] > row.memoryStateCounts[best] ? state : best,
          "new_exposure" as MemoryState);

          return {
            topicId: row.topicId,
            topicName: row.topicName,
            subject: row.subject,
            classLevel: row.classLevel,
            totalConcepts: row.totalConcepts,
            averageForgetRisk: Number(avgRisk.toFixed(4)),
            averageEffectiveMastery: Number(avgMastery.toFixed(4)),
            dominantMemoryState: dominantState,
            memoryStateCounts: row.memoryStateCounts,
            concepts: row.concepts
              .sort((a, b) => b.forgetRiskScore - a.forgetRiskScore)
              .slice(0, 5),
          };
        })
        .sort((a, b) => b.averageForgetRisk - a.averageForgetRisk);

      const stateCounts = concepts.reduce(
        (acc, c) => {
          acc[c.memoryState] += 1;
          return acc;
        },
        { new_exposure: 0, fragile: 0, stabilizing: 0, durable: 0 } as Record<
          MemoryState,
          number
        >,
      );

      const avgRisk =
        concepts.length > 0
          ? concepts.reduce((sum, c) => sum + c.forgetRiskScore, 0) / concepts.length
          : 0;
      const avgEffectiveMastery =
        concepts.length > 0
          ? concepts.reduce((sum, c) => sum + c.effectiveMastery, 0) / concepts.length
          : 0;

      const recommendations = topConcepts.slice(0, 6).map((c) => ({
        conceptId: c.conceptId,
        conceptName: c.conceptName,
        topicId: c.topicId,
        subtopicId: c.subtopicId,
        memoryState: c.memoryState,
        forgetRiskScore: Number(c.forgetRiskScore.toFixed(4)),
        confidenceBand: c.confidenceBand,
        rationale: c.rationale,
        nextBestAction: c.nextBestAction,
      }));

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalConcepts: concepts.length,
            memoryStateCounts: stateCounts,
            averageForgetRisk: Number(avgRisk.toFixed(4)),
            averageEffectiveMastery: Number(avgEffectiveMastery.toFixed(4)),
            highRiskConcepts: concepts.filter((c) => c.forgetRiskScore >= 0.65).length,
          },
          regions,
          concepts: topConcepts.map((c) => ({
            ...c,
            forgetRiskScore: Number(c.forgetRiskScore.toFixed(4)),
            effectiveMastery: Number(c.effectiveMastery.toFixed(4)),
            mastery: Number(c.mastery.toFixed(4)),
          })),
          recommendations,
          copyGuidelines: {
            framing:
              "This is a learning-memory map. It estimates study risk signals and does not diagnose brain health.",
            uncertainty:
              "Use confidence bands and risk ranges, not exact certainty language.",
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getMemoryMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const subject = req.query.subject as string | undefined;
      const classLevel = req.query.classLevel
        ? parseInt(req.query.classLevel as string)
        : undefined;

      const [concepts, sessions] = await Promise.all([
        conceptService.getMemorySignalsForStudent(studentId, { subject, classLevel }),
        prisma.session.findMany({
          where: { studentId, sessionStatus: "complete" },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      const sevenDayEligible = concepts.filter((c) => c.attempts >= 2);
      const thirtyDayEligible = concepts.filter((c) => c.attempts >= 4);

      const sevenDayRetained = sevenDayEligible.filter((c) => c.halfLifeDays >= 7);
      const thirtyDayRetained = thirtyDayEligible.filter((c) => c.halfLifeDays >= 30);

      const highRisk = concepts.filter((c) => c.forgetRiskScore >= 0.65);
      const highRiskActed = highRisk.filter((c) => (c.daysSinceAttempt ?? 999) <= 2);

      const recent7 = sessions.filter((s) => now - s.createdAt.getTime() <= 7 * dayMs);
      const recent30 = sessions.filter((s) => now - s.createdAt.getTime() <= 30 * dayMs);

      const uniqueDays = (dates: Date[]) =>
        new Set(dates.map((d) => d.toISOString().slice(0, 10))).size;

      const activeDays7 = uniqueDays(recent7.map((s) => s.createdAt));
      const activeDays30 = uniqueDays(recent30.map((s) => s.createdAt));

      const pct = (num: number, den: number) => (den === 0 ? 0 : num / den);

      res.status(200).json({
        success: true,
        data: {
          observed: {
            sevenDayRetentionRate: Number(
              pct(sevenDayRetained.length, sevenDayEligible.length).toFixed(4),
            ),
            thirtyDayRetentionRate: Number(
              pct(thirtyDayRetained.length, thirtyDayEligible.length).toFixed(4),
            ),
            recommendationAcceptanceProxy: Number(
              pct(highRiskActed.length, highRisk.length).toFixed(4),
            ),
            weeklyActiveLearningDays: activeDays7,
            monthlyActiveLearningDays: activeDays30,
          },
          denominators: {
            sevenDayEligibleConcepts: sevenDayEligible.length,
            thirtyDayEligibleConcepts: thirtyDayEligible.length,
            highRiskConcepts: highRisk.length,
            completeSessionsLast7Days: recent7.length,
            completeSessionsLast30Days: recent30.length,
          },
          targets: {
            sevenDayRetentionRate: 0.65,
            thirtyDayRetentionRate: 0.45,
            recommendationAcceptanceProxy: 0.6,
            weeklyActiveLearningDays: 4,
            monthlyActiveLearningDays: 12,
          },
          experimentDesign: {
            primaryKpi: "sevenDayRetentionRate",
            secondaryKpis: [
              "thirtyDayRetentionRate",
              "recommendationAcceptanceProxy",
              "weeklyActiveLearningDays",
            ],
            suggestedABSplit: "50_50",
            minimumRunDays: 21,
            notes: [
              "Use delayed recall performance over engagement-only metrics.",
              "Treat recommendationAcceptanceProxy as directional, not causal proof.",
              "Track both treatment and control by classLevel and starting mastery band.",
            ],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
