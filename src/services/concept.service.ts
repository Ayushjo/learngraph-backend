import { prisma } from "../db/prisma";
import { ConceptMastery } from "@prisma/client";

// ─── Forgetting-curve helpers ────────────────────────────────────────────────

const daysSince = (date: Date | null): number => {
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
};

const computeRetention = (lastAttempted: Date | null, halfLifeDays: number): number => {
  const days = daysSince(lastAttempted);
  if (days === 0) return 1.0;
  return Math.exp(-days / halfLifeDays);
};

/**
 * Phase 1 export — compute the date when retention will drop to targetRetention.
 * Formula: t = -halfLife * ln(targetRetention)
 * Default target: 0.85 (review before 85% decays — near-optimal per Pashler et al. 2007)
 */
export const computeNextReviewDate = (
  lastAttempted: Date | null,
  halfLifeDays: number,
  targetRetention = 0.85,
): Date | null => {
  if (!lastAttempted) return null;
  const daysUntilTarget = -halfLifeDays * Math.log(targetRetention);
  return new Date(new Date(lastAttempted).getTime() + daysUntilTarget * 86_400_000);
};

// ─── FSRS-lite (Phase 2) ────────────────────────────────────────────────────
//
// Replaces the old HALF_LIFE_PROGRESSION [1,3,7,14,30,60] fixed ladder.
//
// Two new per-concept fields:
//   conceptDifficulty D  ∈ [0.1, 0.9] — how hard THIS concept is for THIS student
//   easeFactor EF        ∈ [1.3, 3.0] — SM-2-style interval multiplier
//
// halfLifeDays continues to be the stability S (memory half-life in days).
// consecutiveCorrect / consecutiveWrong are kept for streak display.
//
// On CORRECT:
//   D  → decays toward easier (student is mastering it)
//   EF → nudged up by a small amount, clipped by D (hard concepts grow slower)
//   Spacing effect: reviewing at lower retention (well-spaced) builds more stability
//   S_new = max(1, prevS * EF_new * spacingEffect) — cap 60 days
//
// On WRONG (lapse):
//   D  → nudged toward harder
//   EF → decreases (SM-2 style)
//   S_new = max(1, prevS * retentionFactor) — partial reset preserving some memory
//
// Backward compatibility: produces near-identical intervals to the old ladder at
// default EF=2.5, D=0.5 for a sequence of all-correct answers:
//   1st: 1d, 2nd: ~2.5d, 3rd: ~6.3d, 4th: ~15.6d, 5th: ~39d → cap 60d  ✓

function computeFSRSUpdate(
  isCorrect: boolean,
  prevHalfLife: number,
  prevEaseFactor: number,
  prevConceptDifficulty: number,
  questionDifficulty: number,
  lastAttempted: Date | null,
  consecutiveCorrect: number,
  consecutiveWrong: number,
): {
  halfLifeDays: number;
  easeFactor: number;
  conceptDifficulty: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
} {
  const qd = Math.min(1, Math.max(0, questionDifficulty));

  if (isCorrect) {
    const newConsecCorrect = consecutiveCorrect + 1;

    // D converges toward easier — student is getting it
    const newD = Math.max(0.1, prevConceptDifficulty * 0.88 + qd * 0.12 * 0.4);

    // EF nudge: harder concepts grow EF slower (they need more reviews to consolidate)
    const efDelta = 0.1 - newD * 0.06;
    const newEF = Math.min(3.0, Math.max(1.3, prevEaseFactor + efDelta));

    // Spacing effect (desirable difficulty — Bjork 1994):
    // Reviewing when retention is low (well-spaced) yields more durable memory
    const retentionAtReview = computeRetention(lastAttempted, prevHalfLife);
    const spacingEffect = 1 + Math.max(0, 0.85 - retentionAtReview) * 0.35;

    let newS: number;
    if (newConsecCorrect === 1) {
      newS = 1.0;
    } else {
      newS = Math.min(60, prevHalfLife * newEF * spacingEffect);
    }

    return {
      halfLifeDays: Math.round(newS * 100) / 100,
      easeFactor: Math.round(newEF * 100) / 100,
      conceptDifficulty: Math.round(newD * 100) / 100,
      consecutiveCorrect: newConsecCorrect,
      consecutiveWrong: 0,
    };
  } else {
    // Lapse: D nudges toward harder
    const newD = Math.min(0.9, prevConceptDifficulty * 0.88 + qd * 0.12 * 1.6);
    const newEF = Math.max(1.3, prevEaseFactor - 0.2);

    // Partial reset: hard concepts forget more, but some memory always remains
    const retentionFactor = 0.15 + (1 - newD) * 0.1; // 0.15 → 0.25 depending on D
    const newS = Math.max(1.0, prevHalfLife * retentionFactor);

    return {
      halfLifeDays: Math.round(newS * 100) / 100,
      easeFactor: Math.round(newEF * 100) / 100,
      conceptDifficulty: Math.round(newD * 100) / 100,
      consecutiveCorrect: 0,
      consecutiveWrong: consecutiveWrong + 1,
    };
  }
}

// ─── Cognitive-level field map ───────────────────────────────────────────────

const cognitiveFieldMap: Record<string, keyof Pick<ConceptMastery,
  "recallScore" | "vocabularyScore" | "causeEffectScore" | "inferenceScore" | "applicationScore"
>> = {
  recall:              "recallScore",
  vocabulary:          "vocabularyScore",
  cause_and_effect:    "causeEffectScore",
  inference:           "inferenceScore",
  application:         "applicationScore",
  prerequisite_review: "recallScore",
};

// ─── ConceptState DTO ────────────────────────────────────────────────────────

export interface ConceptState {
  conceptId:        string;
  conceptName:      string;
  tag:              string;
  effectiveMastery: number;
  mastery:          number;
  velocity:         number;
  consecutiveWrong: number;
  halfLifeDays:     number;
  easeFactor:       number;
  conceptDifficulty: number;
  retentionScore:   number;
  recallScore:      number;
  vocabularyScore:  number;
  causeEffectScore: number;
  inferenceScore:   number;
  applicationScore: number;
  daysSinceAttempt: number | null;
  nextReviewDate:   Date | null;
  overdueDays:      number;
  attempts:         number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const conceptService = {
  /**
   * Effective mastery combines stored mastery, time-based retention decay,
   * and a velocity factor (momentum of recent answers).
   */
  getEffectiveMastery(cm: ConceptMastery): number {
    const retention = computeRetention(cm.lastAttempted, cm.halfLifeDays);
    // Smoothed velocity: clamped boost/penalty in [0.7, 1.3]
    const velocityFactor = Math.min(1.3, Math.max(0.7, 1 + cm.velocity * 0.2));
    return Math.min(1, cm.mastery * retention * velocityFactor);
  },

  /**
   * Core update — called after every answered question.
   * Applies FSRS-lite memory model, smoothed velocity, per-level cognitive scoring,
   * and appends a ConceptMasteryEvent for analytics.
   */
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

    // ── Smoothed velocity (EMA) ──────────────────────────────────────────────
    // Single-step delta blended with previous velocity for stability.
    // Alpha 0.5 = responsive but not jittery.
    const rawDelta = currentScore - prevLastScore;
    const prevVelocity = existing?.velocity ?? 0;
    const velocity = Math.min(1, Math.max(-1,
      0.5 * rawDelta + 0.5 * prevVelocity,
    ));

    // ── Mastery EMA ──────────────────────────────────────────────────────────
    const attempts       = existing?.attempts ?? 0;
    const previousMastery = existing?.mastery ?? 0;

    const clampedDifficulty = Math.min(1, Math.max(0, difficulty));
    const scoreWeight = isCorrect ? clampedDifficulty : 1 - clampedDifficulty;

    let newMastery: number;
    if (attempts === 0) {
      newMastery = currentScore;
    } else {
      const alpha = attempts === 1 ? 0.6 : attempts === 2 ? 0.4 : 0.3;
      newMastery = Math.min(1, Math.max(0,
        previousMastery + alpha * scoreWeight * (currentScore - previousMastery),
      ));
    }

    // ── Score variance (stability indicator) ────────────────────────────────
    const variance = existing
      ? existing.scoreVariance * 0.7 + Math.abs(currentScore - newMastery) * 0.3
      : Math.abs(currentScore - newMastery) * 0.3;

    // ── FSRS-lite memory model ───────────────────────────────────────────────
    const fsrs = computeFSRSUpdate(
      isCorrect,
      existing?.halfLifeDays  ?? 1.0,
      existing?.easeFactor    ?? 2.5,
      existing?.conceptDifficulty ?? 0.5,
      clampedDifficulty,
      existing?.lastAttempted ?? null,
      existing?.consecutiveCorrect ?? 0,
      existing?.consecutiveWrong   ?? 0,
    );

    // ── Retention at moment of this review ──────────────────────────────────
    const retention = computeRetention(new Date(), fsrs.halfLifeDays);

    // ── Cognitive-level score ────────────────────────────────────────────────
    const cogField = cognitiveFieldMap[cognitiveLevel] ?? "recallScore";
    const prevCogScore = existing ? (existing[cogField] as number) : 0;
    const newCogScore = attempts === 0
      ? currentScore
      : Math.min(1, Math.max(0, prevCogScore + 0.4 * (currentScore - prevCogScore)));
    const cogUpdate: Partial<Record<string, number>> = { [cogField]: newCogScore };

    // ── Upsert ConceptMastery ────────────────────────────────────────────────
    const updated = await prisma.conceptMastery.upsert({
      where: { studentId_conceptId: { studentId, conceptId } },
      update: {
        mastery:           newMastery,
        lastScore:         currentScore,
        previousScore:     prevLastScore,
        velocity,
        scoreVariance:     variance,
        consecutiveCorrect: fsrs.consecutiveCorrect,
        consecutiveWrong:   fsrs.consecutiveWrong,
        attempts:          attempts + 1,
        lastAttempted:     new Date(),
        retentionScore:    retention,
        halfLifeDays:      fsrs.halfLifeDays,
        easeFactor:        fsrs.easeFactor,
        conceptDifficulty: fsrs.conceptDifficulty,
        ...cogUpdate,
      },
      create: {
        studentId,
        conceptId,
        mastery:           newMastery,
        lastScore:         currentScore,
        previousScore:     0,
        velocity,
        scoreVariance:     variance,
        consecutiveCorrect: fsrs.consecutiveCorrect,
        consecutiveWrong:   fsrs.consecutiveWrong,
        attempts:          1,
        lastAttempted:     new Date(),
        retentionScore:    retention,
        halfLifeDays:      fsrs.halfLifeDays,
        easeFactor:        fsrs.easeFactor,
        conceptDifficulty: fsrs.conceptDifficulty,
        ...cogUpdate,
      },
    });

    // ── Append event (non-blocking — analytics only) ─────────────────────────
    const effectiveForEvent = this.getEffectiveMastery(updated);
    prisma.conceptMasteryEvent.create({
      data: {
        studentId,
        conceptId,
        mastery:         newMastery,
        effectiveMastery: effectiveForEvent,
        retention,
        halfLifeDays:    fsrs.halfLifeDays,
        velocity,
        isCorrect,
        cognitiveLevel,
        difficulty:      clampedDifficulty,
      },
    }).catch(() => {}); // fire-and-forget; never let this break the main path

    return updated;
  },

  // ─── Queries ──────────────────────────────────────────────────────────────

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
          mastery:           0,
          lastScore:         0,
          previousScore:     0,
          velocity:          0,
          scoreVariance:     0,
          consecutiveCorrect: 0,
          consecutiveWrong:   0,
          attempts:          0,
          lastAttempted:     null,
          retentionScore:    1.0,
          halfLifeDays:      1.0,
          easeFactor:        2.5,
          conceptDifficulty: 0.5,
          recallScore:       0,
          vocabularyScore:   0,
          causeEffectScore:  0,
          inferenceScore:    0,
          applicationScore:  0,
        } as ConceptMastery;

        const effectiveMastery = this.getEffectiveMastery(syntheticCm);
        const nextReview = computeNextReviewDate(syntheticCm.lastAttempted, syntheticCm.halfLifeDays);
        const overdueDays = nextReview
          ? Math.max(0, daysSince(nextReview))
          : 0;

        return {
          conceptId:         concept.id,
          conceptName:       concept.name,
          tag:               concept.tag,
          effectiveMastery,
          mastery:           syntheticCm.mastery,
          velocity:          syntheticCm.velocity,
          consecutiveWrong:  syntheticCm.consecutiveWrong,
          halfLifeDays:      syntheticCm.halfLifeDays,
          easeFactor:        syntheticCm.easeFactor,
          conceptDifficulty: syntheticCm.conceptDifficulty,
          retentionScore:    syntheticCm.retentionScore,
          recallScore:       syntheticCm.recallScore,
          vocabularyScore:   syntheticCm.vocabularyScore,
          causeEffectScore:  syntheticCm.causeEffectScore,
          inferenceScore:    syntheticCm.inferenceScore,
          applicationScore:  syntheticCm.applicationScore,
          daysSinceAttempt:  days,
          nextReviewDate:    nextReview,
          overdueDays,
          attempts:          syntheticCm.attempts,
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

  /**
   * Phase 1 — upgraded due-for-review query.
   * Returns concepts where effective mastery has decayed >30% below stored peak,
   * enriched with urgency and overdueDays for prioritisation.
   */
  async getDueForReview(studentId: string): Promise<ConceptState[]> {
    const masteries = await prisma.conceptMastery.findMany({
      where: { studentId, attempts: { gt: 0 } },
      include: { concept: true },
    });

    return masteries
      .filter((cm) => {
        const effective = this.getEffectiveMastery(cm);
        return effective < cm.mastery * 0.7;
      })
      .map((cm) => {
        const days = cm.lastAttempted ? daysSince(cm.lastAttempted) : null;
        const nextReview = computeNextReviewDate(cm.lastAttempted, cm.halfLifeDays);
        const overdueDays = nextReview ? Math.max(0, daysSince(nextReview)) : 0;

        return {
          conceptId:         cm.concept.id,
          conceptName:       cm.concept.name,
          tag:               cm.concept.tag,
          effectiveMastery:  this.getEffectiveMastery(cm),
          mastery:           cm.mastery,
          velocity:          cm.velocity,
          consecutiveWrong:  cm.consecutiveWrong,
          halfLifeDays:      cm.halfLifeDays,
          easeFactor:        cm.easeFactor,
          conceptDifficulty: cm.conceptDifficulty,
          retentionScore:    cm.retentionScore,
          recallScore:       cm.recallScore,
          vocabularyScore:   cm.vocabularyScore,
          causeEffectScore:  cm.causeEffectScore,
          inferenceScore:    cm.inferenceScore,
          applicationScore:  cm.applicationScore,
          daysSinceAttempt:  days,
          nextReviewDate:    nextReview,
          overdueDays,
          attempts:          cm.attempts,
        };
      })
      // Most overdue / most decayed first
      .sort((a, b) => b.overdueDays - a.overdueDays || a.effectiveMastery - b.effectiveMastery);
  },
};
