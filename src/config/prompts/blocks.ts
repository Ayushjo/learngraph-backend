import { ConceptState } from "../../services/concept.service";
import { QuestionSlot } from "../../services/generation/types";

/**
 * Reusable prompt building blocks shared across passage, question and review
 * generation. Extracted from the original content.service god file unchanged so
 * generation behaviour is preserved; this is now the single place to tune them.
 */

// ─── Question types & cognitive-level progression ────────────────────────────

export const questionTypes = [
  { level: "recall", instruction: "Test direct recall — answer explicitly stated in passage. Easiest question." },
  { level: "vocabulary", instruction: "Test understanding of a specific chemical term used in the passage." },
  { level: "cause_and_effect", instruction: "Test cause and effect — why something happens based on the passage." },
  { level: "inference", instruction: "Test inference — not directly stated but logically follows from the passage." },
  { level: "application", instruction: "Test application — real world chemistry scenario based on passage concepts." },
];

const cogLevelProgression = ["recall", "vocabulary", "cause_and_effect", "inference", "application"];

export function getWeakestCogLevel(state: ConceptState): string {
  const scores = [
    { level: "recall", score: state.recallScore },
    { level: "vocabulary", score: state.vocabularyScore },
    { level: "cause_and_effect", score: state.causeEffectScore },
    { level: "inference", score: state.inferenceScore },
    { level: "application", score: state.applicationScore },
  ];

  const allZero = scores.every((s) => s.score === 0);
  if (allZero) {
    const m = state.effectiveMastery;
    if (m < 0.3) return "recall";
    if (m < 0.5) return "vocabulary";
    if (m < 0.7) return "cause_and_effect";
    if (m < 0.85) return "inference";
    return "application";
  }

  return scores.sort((a, b) => a.score - b.score)[0].level;
}

function getNextCogLevel(cogLevel: string): string {
  const idx = cogLevelProgression.indexOf(cogLevel);
  if (idx === -1 || idx >= cogLevelProgression.length - 1) return "inference";
  return cogLevelProgression[idx + 1];
}

export function getTargetDifficulty(effectiveMastery: number): number {
  const m = Math.min(1, Math.max(0, effectiveMastery));
  if (m < 0.3) return Math.round((0.2 + m * 0.5) * 100) / 100;
  if (m < 0.6) return Math.round((0.35 + (m - 0.3) * 1.0) * 100) / 100;
  if (m < 0.8) return Math.round((0.65 + (m - 0.6) * 0.75) * 100) / 100;
  return Math.round((0.8 + (m - 0.8) * 0.5) * 100) / 100;
}

// ─── Question allocation across concepts ─────────────────────────────────────

export function buildQuestionAllocation(concepts: ConceptState[]): QuestionSlot[] {
  if (concepts.length === 0) return [];

  const sorted = [...concepts].sort((a, b) => a.effectiveMastery - b.effectiveMastery);
  const n = sorted.length;

  const q1to5ConceptIndices: number[][] = [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 2, 1],
    [0, 0, 1, 2, 3],
    [0, 1, 2, 3, 4],
  ];

  const indices = q1to5ConceptIndices[Math.min(n, 5) - 1];
  const slots: QuestionSlot[] = [];

  for (let i = 0; i < 5; i++) {
    const c = sorted[indices[i]];
    slots.push({
      index: i,
      conceptTag: c.tag,
      conceptName: c.conceptName,
      cognitiveLevel: getWeakestCogLevel(c),
      targetDifficulty: getTargetDifficulty(c.effectiveMastery),
      isBackup: false,
    });
  }

  const backup1 = sorted[0];
  const backup2 = n >= 2 ? sorted[1] : sorted[0];

  slots.push({
    index: 5,
    conceptTag: backup1.tag,
    conceptName: backup1.conceptName,
    cognitiveLevel: getNextCogLevel(getWeakestCogLevel(backup1)),
    targetDifficulty: getTargetDifficulty(backup1.effectiveMastery),
    isBackup: true,
  });

  slots.push({
    index: 6,
    conceptTag: backup1.tag,
    conceptName: backup1.conceptName,
    cognitiveLevel: "inference",
    targetDifficulty: Math.min(0.9, getTargetDifficulty(backup1.effectiveMastery) + 0.1),
    isBackup: true,
  });

  slots.push({
    index: 7,
    conceptTag: backup2.tag,
    conceptName: backup2.conceptName,
    cognitiveLevel: getNextCogLevel(getWeakestCogLevel(backup2)),
    targetDifficulty: getTargetDifficulty(backup2.effectiveMastery),
    isBackup: true,
  });

  return slots;
}

// ─── Concept-state context blocks ────────────────────────────────────────────

function getMasteryLabel(effectiveMastery: number): string {
  if (effectiveMastery < 0.3) return "CRITICAL GAP";
  if (effectiveMastery < 0.5) return "WEAK";
  if (effectiveMastery < 0.75) return "DEVELOPING";
  return "STRONG";
}

export function buildConceptContext(concepts: ConceptState[]): string {
  if (concepts.length === 0) return "";

  const lines = concepts.map((c) => {
    const masteryPct = Math.round(c.effectiveMastery * 100);
    const label = getMasteryLabel(c.effectiveMastery);
    const velocityLabel =
      c.velocity > 0.1 ? "improving" : c.velocity < -0.1 ? "declining" : "stable";
    const weakestLevel = getWeakestCogLevel(c);
    const retentionPct = Math.round(c.retentionScore * 100);
    const forgetting =
      c.daysSinceAttempt !== null && c.daysSinceAttempt > c.halfLifeDays
        ? `⚠ FORGETTING — last seen ${Math.round(c.daysSinceAttempt)}d ago, retention ${retentionPct}%`
        : c.attempts === 0
          ? "NEVER ATTEMPTED"
          : `retention ${retentionPct}%`;

    return `  [${label}] ${c.conceptName} [tag: ${c.tag}]
    effective mastery: ${masteryPct}%  |  velocity: ${velocityLabel}  |  ${forgetting}
    weakest cognitive level: ${weakestLevel}  |  consecutive wrong: ${c.consecutiveWrong}`;
  });

  return `━━━ CONCEPT MASTERY STATE ━━━
${lines.join("\n\n")}`;
}

export function buildMasteryLabelInstructions(concepts: ConceptState[]): string {
  if (concepts.length === 0) return "";

  const critical = concepts.filter((c) => c.effectiveMastery < 0.3);
  const weak = concepts.filter((c) => c.effectiveMastery >= 0.3 && c.effectiveMastery < 0.5);
  const developing = concepts.filter((c) => c.effectiveMastery >= 0.5 && c.effectiveMastery < 0.75);
  const strong = concepts.filter((c) => c.effectiveMastery >= 0.75);

  const lines: string[] = [];

  if (critical.length > 0) {
    lines.push(`CRITICAL GAP concepts — ${critical.map((c) => `"${c.conceptName}"`).join(", ")}:
  • Passage must explain this concept clearly from scratch using a concrete Indian example
  • Questions targeting these concepts MUST be recall or vocabulary level (difficulty ≤ 0.40)
  • Do NOT assume the student has any prior understanding of these`);
  }

  if (weak.length > 0) {
    lines.push(`WEAK concepts — ${weak.map((c) => `"${c.conceptName}"`).join(", ")}:
  • Passage must reinforce the core idea with a cause-and-effect explanation
  • Questions targeting these should be vocabulary or cause_and_effect level (difficulty 0.30–0.55)
  • Address common misconceptions related to these concepts`);
  }

  if (developing.length > 0) {
    lines.push(`DEVELOPING concepts — ${developing.map((c) => `"${c.conceptName}"`).join(", ")}:
  • Student knows the basics — push them toward deeper understanding
  • Questions targeting these should be cause_and_effect or inference level (difficulty 0.50–0.70)
  • Bridge from what they know to what they don't yet apply`);
  }

  if (strong.length > 0) {
    lines.push(`STRONG concepts — ${strong.map((c) => `"${c.conceptName}"`).join(", ")}:
  • Student has solid mastery — challenge them with application or inference
  • Questions targeting these should be inference or application level (difficulty 0.65–0.90)
  • Present novel scenarios or edge cases not directly in the passage`);
  }

  if (lines.length === 0) return "";

  return `━━━ MANDATORY CONCEPT-LEVEL INSTRUCTIONS ━━━
${lines.join("\n\n")}`;
}

export function buildForgettingContext(concepts: ConceptState[]): string {
  const forgetting = concepts.filter(
    (c) => c.daysSinceAttempt !== null && c.daysSinceAttempt > c.halfLifeDays,
  );

  if (forgetting.length === 0) return "";

  const lines = forgetting.map((c) => {
    const days = Math.round(c.daysSinceAttempt!);
    const retention = Math.round(c.retentionScore * 100);
    return `  - ${c.conceptName}: last seen ${days} days ago, retention only ${retention}% — reinforce in passage`;
  });

  return `━━━ FORGETTING ALERT — REINFORCE THESE IN THE PASSAGE ━━━
Student previously learned these but retention has dropped significantly:
${lines.join("\n")}
Even if effective mastery looks acceptable, the student is losing these. Weave them naturally into the passage.`;
}

export function buildAllocationTable(slots: QuestionSlot[]): string {
  const rows = slots.map((s) => {
    const label = s.isBackup ? "[BACKUP — completely different angle/example from Q1-Q5]" : "";
    return `  Q${s.index + 1}  concept: "${s.conceptTag}"  |  cognitive: ${s.cognitiveLevel}  |  difficulty: ${s.targetDifficulty}  ${label}`;
  });

  return `━━━ QUESTION ASSIGNMENT — FOLLOW EXACTLY ━━━
Generate exactly 8 questions following this allocation:
${rows.join("\n")}

Rules for backup questions (Q6-Q8):
- MUST test the same concept from a completely different real-world scenario or angle
- MUST NOT repeat the same example, framing, or distractor set as Q1-Q5
- A student who got Q1 wrong should find Q6 genuinely helpful, not just a reworded version`;
}

export const getBloomsDistribution = (mastery: number, attempts: number): string => {
  if (attempts === 0 || mastery < 0.3) {
    return `BLOOM'S FALLBACK DISTRIBUTION (mastery: ${Math.round(mastery * 100)}%):
Student is at foundational level — weight toward recall and vocabulary, avoid tricky inference.`;
  }
  if (mastery < 0.6) {
    return `BLOOM'S FALLBACK DISTRIBUTION (mastery: ${Math.round(mastery * 100)}%):
Student is developing — balanced spread across all cognitive levels.`;
  }
  if (mastery < 0.8) {
    return `BLOOM'S FALLBACK DISTRIBUTION (mastery: ${Math.round(mastery * 100)}%):
Student has good mastery — weight toward inference and application.`;
  }
  return `BLOOM'S FALLBACK DISTRIBUTION (mastery: ${Math.round(mastery * 100)}%):
Student has high mastery — push hard on inference, application, and edge cases.`;
};
