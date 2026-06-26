import { prisma } from "../db/prisma";

export type GenerationStage =
  | "context"
  | "prompt"
  | "generate"
  | "validate"
  | "persist"
  | "summarize";

export interface GenerationLogInput {
  sessionId?: string;
  stage: GenerationStage;
  model?: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  source?: "bank" | "generated";
  validationScore?: number;
  retries?: number;
}

export const generationLogService = {
  async log(entry: GenerationLogInput): Promise<void> {
    try {
      await prisma.generationLog.create({
        data: {
          sessionId: entry.sessionId,
          stage: entry.stage,
          model: entry.model,
          promptVersion: entry.promptVersion,
          inputTokens: entry.inputTokens,
          outputTokens: entry.outputTokens,
          latencyMs: entry.latencyMs,
          source: entry.source,
          validationScore: entry.validationScore,
          retries: entry.retries ?? 0,
        },
      });
    } catch {
      // Observability must not break generation
    }
  },

  async getDailyStats(days = 7) {
    const since = new Date(Date.now() - days * 86_400_000);
    const logs = await prisma.generationLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        stage: true,
        source: true,
        inputTokens: true,
        outputTokens: true,
        latencyMs: true,
        validationScore: true,
        createdAt: true,
      },
    });

    const byDay = new Map<string, {
      totalTokens: number;
      bankHits: number;
      generated: number;
      validationScores: number[];
      latencies: number[];
    }>();

    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(day) ?? {
        totalTokens: 0,
        bankHits: 0,
        generated: 0,
        validationScores: [],
        latencies: [],
      };
      bucket.totalTokens += (log.inputTokens ?? 0) + (log.outputTokens ?? 0);
      if (log.source === "bank") bucket.bankHits += 1;
      if (log.source === "generated") bucket.generated += 1;
      if (log.validationScore != null) bucket.validationScores.push(log.validationScore);
      if (log.latencyMs != null) bucket.latencies.push(log.latencyMs);
      byDay.set(day, bucket);
    }

    return [...byDay.entries()].map(([day, stats]) => ({
      day,
      totalTokens: stats.totalTokens,
      bankHitRate: stats.bankHits + stats.generated > 0
        ? stats.bankHits / (stats.bankHits + stats.generated)
        : 0,
      meanValidationScore: stats.validationScores.length > 0
        ? stats.validationScores.reduce((a, b) => a + b, 0) / stats.validationScores.length
        : null,
      p95LatencyMs: stats.latencies.length > 0
        ? stats.latencies.sort((a, b) => a - b)[Math.floor(stats.latencies.length * 0.95)] ?? null
        : null,
    }));
  },
};
