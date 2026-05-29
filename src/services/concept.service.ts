import { prisma } from "../db/prisma";
import { ConceptMastery } from "@prisma/client";

const HALF_LIFE_PROGRESSION = [1, 3, 7, 14, 30, 60];

const daysSince = (date: Date | null): number => {
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
};

const computeRetention = (lastAttempted: Date | null, halfLifeDays: number): number => {
  const days = daysSince(lastAttempted);
  if (days === 0) return 1.0;
  return Math.exp(-days / halfLifeDays);
};

const cognitiveFieldMap: Record<string, keyof Pick<ConceptMastery,
  "recallScore" | "vocabularyScore" | "causeEffectScore" | "inferenceScore" | "applicationScore"
>> = {
  recall: "recallScore",
  vocabulary: "vocabularyScore",
  cause_and_effect: "causeEffectScore",
  inference: "inferenceScore",
  application: "applicationScore",
  prerequisite_review: "recallScore",
};

export interface ConceptState {
  conceptId: string;
  conceptName: string;
  tag: string;
  effectiveMastery: number;
  mastery: number;
  velocity: number;
  consecutiveWrong: number;
  halfLifeDays: number;
  retentionScore: number;
  recallScore: number;
  vocabularyScore: number;
  causeEffectScore: number;
  inferenceScore: number;
  applicationScore: number;
  daysSinceAttempt: number | null;
  attempts: number;
}

export type MemoryState = "new_exposure" | "fragile" | "stabilizing" | "durable";
export type ConfidenceBand = "low" | "medium" | "high";

export interface ForgetRiskBreakdown {
  masteryGap: number;
  decayPressure: number;
  instability: number;
  wrongStreak: number;
}

export interface MemoryConceptState extends ConceptState {
  subject: string;
  classLevel: number;
  topicId: string;
  subtopicId: string;
  subtopicName: string;
  memoryState: MemoryState;
  forgetRiskScore: number;
  confidenceBand: ConfidenceBand;
  rationale: string[];
  nextBestAction: string;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const getConfidenceBand = (attempts: number): ConfidenceBand => {
  if (attempts < 2) return "low";
  if (attempts < 5) return "medium";
  return "high";
};

const computeForgetRiskBreakdown = (
  effectiveMastery: number,
  daysSinceAttempt: number | null,
  halfLifeDays: number,
  scoreVariance: number,
  consecutiveWrong: number,
): ForgetRiskBreakdown => {
  const masteryGap = clamp01(1 - effectiveMastery);
  const decayPressure = clamp01(((daysSinceAttempt ?? 0) / Math.max(halfLifeDays, 1)) / 2);
  const instability = clamp01(scoreVariance);
  const wrongStreak = clamp01(consecutiveWrong / 3);

  return {
    masteryGap,
    decayPressure,
    instability,
    wrongStreak,
  };
};

const computeForgetRiskScore = (
  breakdown: ForgetRiskBreakdown,
  attempts: number,
): number => {
  if (attempts === 0) return 0.95;

  const weighted =
    breakdown.masteryGap * 0.45 +
    breakdown.decayPressure * 0.25 +
    breakdown.instability * 0.15 +
    breakdown.wrongStreak * 0.15;

  return clamp01(weighted);
};

const classifyMemoryState = (
  attempts: number,
  effectiveMastery: number,
  forgetRiskScore: number,
  halfLifeDays: number,
): MemoryState => {
  if (attempts <= 1) return "new_exposure";
  if (forgetRiskScore >= 0.65 || effectiveMastery < 0.45) return "fragile";
  if (effectiveMastery >= 0.75 && forgetRiskScore <= 0.35 && halfLifeDays >= 14) return "durable";
  return "stabilizing";
};

const getNextBestAction = (
  memoryState: MemoryState,
  forgetRiskScore: number,
): string => {
  if (memoryState === "new_exposure") {
    return "Do a 3-question retrieval drill today to lock first exposure.";
  }
  if (memoryState === "fragile") {
    return "Run a mixed practice burst now, then retest after 24 hours.";
  }
  if (memoryState === "durable") {
    return "Schedule a light spaced check-in after 7+ days.";
  }
  if (forgetRiskScore >= 0.5) {
    return "Do one delayed recall quiz within the next 48 hours.";
  }
  return "Keep current pace and revisit this concept in your weekly review.";
};

const buildRationale = (
  breakdown: ForgetRiskBreakdown,
  attempts: number,
  daysSinceAttempt: number | null,
): string[] => {
  const reasons: string[] = [];

  if (attempts <= 1) reasons.push("Low evidence so far; confidence is still limited.");
  if (breakdown.masteryGap >= 0.5) reasons.push("Current effective mastery is below desired level.");
  if (breakdown.decayPressure >= 0.45) {
    reasons.push(`Longer gap since last attempt (${Math.round(daysSinceAttempt ?? 0)}d) increases forgetting risk.`);
  }
  if (breakdown.wrongStreak >= 0.67) reasons.push("Recent wrong-answer streak signals unstable recall.");
  if (breakdown.instability >= 0.4) reasons.push("Performance has been variable across attempts.");

  if (reasons.length === 0) {
    reasons.push("Recent performance and spacing suggest stable retention.");
  }

  return reasons.slice(0, 3);
};

export const conceptService = {
  getEffectiveMastery(cm: ConceptMastery): number {
    const retention = computeRetention(cm.lastAttempted, cm.halfLifeDays);
    const velocityFactor = Math.min(1.3, Math.max(0.7, 1 + cm.velocity * 0.2));
    return Math.min(1, cm.mastery * retention * velocityFactor);
  },

  computeUpdatedHalfLife(
    consecutiveCorrect: number,
    consecutiveWrong: number,
    isCorrect: boolean,
  ): { halfLifeDays: number; consecutiveCorrect: number; consecutiveWrong: number } {
    if (isCorrect) {
      const newConsecCorrect = consecutiveCorrect + 1;
      const idx = Math.min(newConsecCorrect - 1, HALF_LIFE_PROGRESSION.length - 1);
      return {
        halfLifeDays: HALF_LIFE_PROGRESSION[idx],
        consecutiveCorrect: newConsecCorrect,
        consecutiveWrong: 0,
      };
    }
    return {
      halfLifeDays: 1.0,
      consecutiveCorrect: 0,
      consecutiveWrong: consecutiveWrong + 1,
    };
  },

  async updateConceptMastery(
    studentId: string,
    conceptId: string,
    isCorrect: boolean,
    cognitiveLevel: string,
    difficulty = 0.5,
  ): Promise<ConceptMastery> {
    const existing = await prisma.conceptMastery.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    });

    const currentScore = isCorrect ? 1.0 : 0.0;
    const prevLastScore = existing?.lastScore ?? 0;
    const velocity = currentScore - prevLastScore;

    const attempts = existing?.attempts ?? 0;
    const previousMastery = existing?.mastery ?? 0;

    const clampedDifficulty = Math.min(1, Math.max(0, difficulty));
    const scoreWeight = isCorrect ? clampedDifficulty : 1 - clampedDifficulty;

    let newMastery: number;
    if (attempts === 0) {
      newMastery = currentScore;
    } else {
      const alpha = attempts === 1 ? 0.6 : attempts === 2 ? 0.4 : 0.3;
      newMastery = Math.min(1, Math.max(0, previousMastery + alpha * scoreWeight * (currentScore - previousMastery)));
    }

    const variance = existing
      ? existing.scoreVariance * 0.7 + Math.abs(currentScore - newMastery) * 0.3
      : Math.abs(currentScore - newMastery) * 0.3;

    const halfLifeUpdate = this.computeUpdatedHalfLife(
      existing?.consecutiveCorrect ?? 0,
      existing?.consecutiveWrong ?? 0,
      isCorrect,
    );

    const retention = computeRetention(new Date(), halfLifeUpdate.halfLifeDays);

    const cogField = cognitiveFieldMap[cognitiveLevel] ?? "recallScore";
    const prevCogScore = existing ? (existing[cogField] as number) : 0;
    const newCogScore = attempts === 0
      ? currentScore
      : Math.min(1, Math.max(0, prevCogScore + 0.4 * (currentScore - prevCogScore)));

    const cogUpdate: Partial<Record<string, number>> = { [cogField]: newCogScore };

    return prisma.conceptMastery.upsert({
      where: { studentId_conceptId: { studentId, conceptId } },
      update: {
        mastery: newMastery,
        lastScore: currentScore,
        previousScore: prevLastScore,
        velocity,
        scoreVariance: variance,
        consecutiveCorrect: halfLifeUpdate.consecutiveCorrect,
        consecutiveWrong: halfLifeUpdate.consecutiveWrong,
        attempts: attempts + 1,
        lastAttempted: new Date(),
        retentionScore: retention,
        halfLifeDays: halfLifeUpdate.halfLifeDays,
        ...cogUpdate,
      },
      create: {
        studentId,
        conceptId,
        mastery: newMastery,
        lastScore: currentScore,
        previousScore: 0,
        velocity,
        scoreVariance: variance,
        consecutiveCorrect: halfLifeUpdate.consecutiveCorrect,
        consecutiveWrong: halfLifeUpdate.consecutiveWrong,
        attempts: 1,
        lastAttempted: new Date(),
        retentionScore: retention,
        halfLifeDays: halfLifeUpdate.halfLifeDays,
        ...cogUpdate,
      },
    });
  },

  async getConceptsForSubtopic(studentId: string, subtopicId: string): Promise<ConceptState[]> {
    const concepts = await prisma.concept.findMany({
      where: { subtopicId },
      include: {
        conceptMasteries: {
          where: { studentId },
          take: 1,
        },
      },
    });

    return concepts
      .map((concept) => {
        const cm = concept.conceptMasteries[0] ?? null;
        const days = cm?.lastAttempted ? daysSince(cm.lastAttempted) : null;

        const syntheticCm = cm ?? {
          id: "",
          studentId,
          conceptId: concept.id,
          mastery: 0,
          lastScore: 0,
          previousScore: 0,
          velocity: 0,
          scoreVariance: 0,
          consecutiveCorrect: 0,
          consecutiveWrong: 0,
          attempts: 0,
          lastAttempted: null,
          retentionScore: 1.0,
          halfLifeDays: 1.0,
          recallScore: 0,
          vocabularyScore: 0,
          causeEffectScore: 0,
          inferenceScore: 0,
          applicationScore: 0,
        } as ConceptMastery;

        const effectiveMastery = this.getEffectiveMastery(syntheticCm);

        return {
          conceptId: concept.id,
          conceptName: concept.name,
          tag: concept.tag,
          effectiveMastery,
          mastery: syntheticCm.mastery,
          velocity: syntheticCm.velocity,
          consecutiveWrong: syntheticCm.consecutiveWrong,
          halfLifeDays: syntheticCm.halfLifeDays,
          retentionScore: syntheticCm.retentionScore,
          recallScore: syntheticCm.recallScore,
          vocabularyScore: syntheticCm.vocabularyScore,
          causeEffectScore: syntheticCm.causeEffectScore,
          inferenceScore: syntheticCm.inferenceScore,
          applicationScore: syntheticCm.applicationScore,
          daysSinceAttempt: days,
          attempts: syntheticCm.attempts,
        };
      })
      .sort((a, b) => a.effectiveMastery - b.effectiveMastery);
  },

  async getWeakestConcepts(
    studentId: string,
    subtopicId: string,
    limit: number,
  ): Promise<ConceptState[]> {
    const all = await this.getConceptsForSubtopic(studentId, subtopicId);
    return all.filter((c) => c.effectiveMastery < 0.6).slice(0, limit);
  },

  async getDueForReview(studentId: string): Promise<ConceptState[]> {
    const masteries = await prisma.conceptMastery.findMany({
      where: { studentId },
      include: { concept: true },
    });

    return masteries
      .filter((cm) => {
        const effective = this.getEffectiveMastery(cm);
        return effective < cm.mastery * 0.7;
      })
      .map((cm) => {
        const days = cm.lastAttempted ? daysSince(cm.lastAttempted) : null;
        return {
          conceptId: cm.concept.id,
          conceptName: cm.concept.name,
          tag: cm.concept.tag,
          effectiveMastery: this.getEffectiveMastery(cm),
          mastery: cm.mastery,
          velocity: cm.velocity,
          consecutiveWrong: cm.consecutiveWrong,
          halfLifeDays: cm.halfLifeDays,
          retentionScore: cm.retentionScore,
          recallScore: cm.recallScore,
          vocabularyScore: cm.vocabularyScore,
          causeEffectScore: cm.causeEffectScore,
          inferenceScore: cm.inferenceScore,
          applicationScore: cm.applicationScore,
          daysSinceAttempt: days,
          attempts: cm.attempts,
        };
      })
      .sort((a, b) => a.effectiveMastery - b.effectiveMastery);
  },

  async getMemorySignalsForStudent(
    studentId: string,
    filters?: { subject?: string; classLevel?: number },
  ): Promise<MemoryConceptState[]> {
    const concepts = await prisma.concept.findMany({
      where: {
        subtopic: {
          ...(filters?.subject ? { subject: filters.subject } : {}),
          ...(filters?.classLevel ? { classLevel: filters.classLevel } : {}),
        },
      },
      include: {
        subtopic: true,
        conceptMasteries: {
          where: { studentId },
          take: 1,
        },
      },
    });

    const rows: MemoryConceptState[] = concepts.map((concept) => {
      const cm = concept.conceptMasteries[0] ?? null;
      const days = cm?.lastAttempted ? daysSince(cm.lastAttempted) : null;

      const syntheticCm = cm ?? {
        id: "",
        studentId,
        conceptId: concept.id,
        mastery: 0,
        lastScore: 0,
        previousScore: 0,
        velocity: 0,
        scoreVariance: 0,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        attempts: 0,
        lastAttempted: null,
        retentionScore: 1.0,
        halfLifeDays: 1.0,
        recallScore: 0,
        vocabularyScore: 0,
        causeEffectScore: 0,
        inferenceScore: 0,
        applicationScore: 0,
      } as ConceptMastery;

      const effectiveMastery = this.getEffectiveMastery(syntheticCm);
      const breakdown = computeForgetRiskBreakdown(
        effectiveMastery,
        days,
        syntheticCm.halfLifeDays,
        syntheticCm.scoreVariance,
        syntheticCm.consecutiveWrong,
      );
      const forgetRiskScore = computeForgetRiskScore(breakdown, syntheticCm.attempts);
      const memoryState = classifyMemoryState(
        syntheticCm.attempts,
        effectiveMastery,
        forgetRiskScore,
        syntheticCm.halfLifeDays,
      );

      return {
        conceptId: concept.id,
        conceptName: concept.name,
        tag: concept.tag,
        effectiveMastery,
        mastery: syntheticCm.mastery,
        velocity: syntheticCm.velocity,
        consecutiveWrong: syntheticCm.consecutiveWrong,
        halfLifeDays: syntheticCm.halfLifeDays,
        retentionScore: syntheticCm.retentionScore,
        recallScore: syntheticCm.recallScore,
        vocabularyScore: syntheticCm.vocabularyScore,
        causeEffectScore: syntheticCm.causeEffectScore,
        inferenceScore: syntheticCm.inferenceScore,
        applicationScore: syntheticCm.applicationScore,
        daysSinceAttempt: days,
        attempts: syntheticCm.attempts,
        subject: concept.subtopic.subject,
        classLevel: concept.subtopic.classLevel,
        topicId: concept.subtopic.topicId,
        subtopicId: concept.subtopicId,
        subtopicName: concept.subtopic.name,
        memoryState,
        forgetRiskScore,
        confidenceBand: getConfidenceBand(syntheticCm.attempts),
        rationale: buildRationale(breakdown, syntheticCm.attempts, days),
        nextBestAction: getNextBestAction(memoryState, forgetRiskScore),
      };
    });

    return rows.sort((a, b) => b.forgetRiskScore - a.forgetRiskScore);
  },
};
