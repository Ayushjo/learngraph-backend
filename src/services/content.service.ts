import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { getSubtopicById } from "../data/subtopics";
import { conceptService, ConceptState } from "./concept.service";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const gradeProfiles: Record<
  number,
  {
    vocabulary: string;
    sentenceStyle: string;
    analogyDomain: string;
    tone: string;
    conceptDepth: string;
    priorKnowledge: string;
    examContext: string;
  }
> = {
  11: {
    vocabulary:
      "NCERT Class 11 Chemistry terminology — introduce new terms with brief inline explanation, assume basic science knowledge from Class 10",
    sentenceStyle:
      "mix of medium and longer sentences, technical but readable, occasional short punchy statements for emphasis",
    analogyDomain:
      "laboratory experiments, everyday chemical phenomena, industrial processes, human body chemistry, Indian examples like rusting of iron gates, curd formation, cooking",
    tone: "academic and engaging — connects every concept to a real observation or experiment a student can visualise",
    conceptDepth:
      "fundamental principles with mechanisms — explain why not just what, introduce equations in word form, connect to periodic trends and atomic structure",
    priorKnowledge:
      "Class 10 CBSE Science and Maths — student knows basic atomic structure, chemical reactions, acids bases, periodic table basics",
    examContext:
      "Class 11 NCERT Chemistry — JEE and NEET foundation year, concepts must be precise and exam-relevant",
  },
  12: {
    vocabulary:
      "complete NCERT Class 12 Chemistry language — board exam and JEE/NEET aligned, precise definitions, technical terms used freely",
    sentenceStyle:
      "varied — technical descriptions, mechanistic explanations, comparative statements, precise and information-dense",
    analogyDomain:
      "industrial applications, medical relevance, environmental chemistry, real-world Indian examples like Lead acid battery in vehicles, electroplating industries, drug action",
    tone: "exam-precise and application-focused — every sentence carries information, connects theory to applications and board exam relevance",
    conceptDepth:
      "full depth — mechanisms, exceptions, numerical applications, interconnections between chapters, JEE/NEET level reasoning",
    priorKnowledge:
      "Complete Class 11 NCERT Chemistry — student has solid foundation in atomic structure, bonding, thermodynamics, equilibrium, organic basics",
    examContext:
      "Class 12 NCERT Chemistry — board exams and JEE/NEET, highest precision required",
  },
};

const questionTypes = [
  {
    level: "recall",
    instruction:
      "Test direct recall — answer explicitly stated in passage. Easiest question.",
  },
  {
    level: "vocabulary",
    instruction:
      "Test understanding of a specific chemical term used in the passage.",
  },
  {
    level: "cause_and_effect",
    instruction:
      "Test cause and effect — why something happens based on the passage.",
  },
  {
    level: "inference",
    instruction:
      "Test inference — not directly stated but logically follows from the passage.",
  },
  {
    level: "application",
    instruction:
      "Test application — real world chemistry scenario based on passage concepts.",
  },
];

const cogLevelProgression = [
  "recall",
  "vocabulary",
  "cause_and_effect",
  "inference",
  "application",
];

function getWeakestCogLevel(state: ConceptState): string {
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

function getTargetDifficulty(effectiveMastery: number): number {
  const m = Math.min(1, Math.max(0, effectiveMastery));
  if (m < 0.3) return Math.round((0.20 + m * 0.50) * 100) / 100;
  if (m < 0.6) return Math.round((0.35 + (m - 0.3) * 1.00) * 100) / 100;
  if (m < 0.8) return Math.round((0.65 + (m - 0.6) * 0.75) * 100) / 100;
  return Math.round((0.80 + (m - 0.8) * 0.50) * 100) / 100;
}

interface QuestionSlot {
  index: number;
  conceptTag: string;
  conceptName: string;
  cognitiveLevel: string;
  targetDifficulty: number;
  isBackup: boolean;
}

function buildQuestionAllocation(concepts: ConceptState[]): QuestionSlot[] {
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
    targetDifficulty: Math.min(0.9, getTargetDifficulty(backup1.effectiveMastery) + 0.10),
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

function getMasteryLabel(effectiveMastery: number): string {
  if (effectiveMastery < 0.3) return "CRITICAL GAP";
  if (effectiveMastery < 0.5) return "WEAK";
  if (effectiveMastery < 0.75) return "DEVELOPING";
  return "STRONG";
}

function buildConceptContext(concepts: ConceptState[]): string {
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

function buildMasteryLabelInstructions(concepts: ConceptState[]): string {
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

function buildForgettingContext(concepts: ConceptState[]): string {
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

function buildAllocationTable(slots: QuestionSlot[]): string {
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

const getBloomsDistribution = (mastery: number, attempts: number): string => {
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

export type StudentContextInput = {
  previousAttempts: number;
  previousMastery: number;
  weakCognitiveLevels: string[];
  prerequisiteGaps: string[];
  prerequisiteMasteries: Array<{
    name: string;
    topicId: string;
    mastery: number;
    attempts: number;
    hop?: 1 | 2;
  }>;
  completedSubtopicsInChapter: string[];
  wrongQuestions: Array<{
    questionText: string;
    chosenAnswer: string;
    correctAnswer: string;
    explanation: string;
    cognitiveLevel: string;
  }>;
  lastScorePercentage: number;
  conceptStates?: ConceptState[];
  weakestPrerequisiteDetail?: {
    topicId: string;
    topicName: string;
    subtopics: Array<{
      subtopicId: string;
      subtopicName: string;
      mastery: number;
      isComplete: boolean;
      attempts: number;
    }>;
  } | null;
};

export type GeneratedQuestion = {
  index: number;
  cognitiveLevel: string;
  conceptTag: string;
  difficulty: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const contentService = {
  async generatePassageAndQuestions(
    studentId: string,
    subtopicId: string,
    studentContext: StudentContextInput,
  ) {
    const subtopicDef = getSubtopicById(subtopicId);
    if (!subtopicDef) throw new AppError(404, `Subtopic ${subtopicId} not found`);

    const { classLevel, subject, name: subtopicName, keyConceptsSummary, topicId } = subtopicDef;

    if (classLevel !== 11 && classLevel !== 12) {
      throw new AppError(400, "Only Class 11 and 12 supported");
    }

    const profile = gradeProfiles[classLevel];
    const isRetry = studentContext.previousAttempts > 0;

    const conceptStates =
      studentContext.conceptStates && studentContext.conceptStates.length > 0
        ? studentContext.conceptStates
        : await conceptService.getConceptsForSubtopic(studentId, subtopicId);

    const allocation = buildQuestionAllocation(conceptStates);
    const hasConceptData = allocation.length > 0;

    const conceptContext = hasConceptData ? buildConceptContext(conceptStates) : "";
    const forgettingContext = hasConceptData ? buildForgettingContext(conceptStates) : "";
    const masteryLabelInstructions = hasConceptData ? buildMasteryLabelInstructions(conceptStates) : "";
    const allocationTable = hasConceptData ? buildAllocationTable(allocation) : "";

    const systemPrompt = `You are an expert Indian Chemistry teacher and JEE/NEET educator with 20 years of experience teaching NCERT Chemistry for Class 11 and 12.

Your job is to generate a focused reading passage and exactly 8 quiz questions on a SPECIFIC SUBTOPIC of a Chemistry chapter.

${
  isRetry
    ? `⚠️ RETRY ATTEMPT — MANDATORY DIFFERENT CONTENT ⚠️
Student has attempted this subtopic ${studentContext.previousAttempts} time(s).
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%.
Weak question types: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}.

YOU MUST generate a passage that:
1. Approaches the SAME subtopic from a completely different angle or application
2. Uses different Indian examples and scenarios than a standard first attempt
3. Focuses heavily on: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}
4. Does NOT repeat the standard textbook introduction
5. ${studentContext.lastScorePercentage >= 80 ? "Increases difficulty — student scored well" : studentContext.lastScorePercentage >= 60 ? "Slightly increases difficulty — student is progressing" : "Addresses specific misconceptions — student is struggling"}
${studentContext.wrongQuestions.length > 0 ? `6. Directly addresses: ${studentContext.wrongQuestions.map((q) => `"${q.chosenAnswer}" (wrong) vs "${q.correctAnswer}" (correct)`).join("; ")}` : ""}`
    : ""
}

CRITICAL RULES:
1. The passage MUST be ONLY about the specific subtopic
2. Every question must be answerable from the passage alone
3. Output ONLY valid JSON — no markdown, no backticks, no extra text
4. Use Indian context throughout — Indian names, industries, examples
5. Content must be NCERT-aligned and JEE/NEET relevant
6. Generate EXACTLY 8 questions — no more, no less`;

    const completedContext =
      studentContext.completedSubtopicsInChapter.length > 0
        ? `━━━ ALREADY COVERED IN THIS CHAPTER ━━━
The student has already completed these — do NOT re-explain:
${studentContext.completedSubtopicsInChapter.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`
        : "";

    const wrongQuestionsContext =
      isRetry && studentContext.wrongQuestions.length > 0
        ? `━━━ SPECIFIC MISCONCEPTIONS FROM LAST ATTEMPT ━━━
${studentContext.wrongQuestions
  .map(
    (q, i) => `MISCONCEPTION ${i + 1} [${q.cognitiveLevel}]:
Question: "${q.questionText}"
Student chose: "${q.chosenAnswer}"
Correct answer: "${q.correctAnswer}"
Why it matters: ${q.explanation}`,
  )
  .join("\n\n")}

MANDATORY: Passage must help the student not make these exact mistakes again.
`
        : "";

    const prereqMasteryContext =
      studentContext.prerequisiteMasteries.length > 0
        ? `PREREQUISITE CHAPTER MASTERY:
${studentContext.prerequisiteMasteries
  .map((p) => {
    const status =
      p.attempts === 0
        ? "NEVER ATTEMPTED"
        : p.mastery < 0.4
          ? `STRUGGLING (${Math.round(p.mastery * 100)}%)`
          : p.mastery < 0.6
            ? `DEVELOPING (${Math.round(p.mastery * 100)}%)`
            : `GOOD (${Math.round(p.mastery * 100)}%)`;
    return `  - ${p.name}: ${status}`;
  })
  .join("\n")}

${
  studentContext.prerequisiteGaps.length > 0
    ? `WEAK PREREQUISITES: Gaps in ${studentContext.prerequisiteGaps.join(", ")}. Weave in the core connecting concept naturally in the passage.`
    : "Prerequisites adequately mastered — go full depth."
}`
        : "";

    const weakestPrereq = studentContext.prerequisiteMasteries
      .filter((p) => p.attempts === 0 || p.mastery < 0.5)
      .sort((a, b) => a.mastery - b.mastery)[0];

    const prereqReinforcementInstruction = weakestPrereq
      ? `━━━ PREREQUISITE REINFORCEMENT — MANDATORY ━━━
Weakest prerequisite: "${weakestPrereq.name}" — ${weakestPrereq.attempts === 0 ? "NEVER ATTEMPTED" : `mastery ${Math.round(weakestPrereq.mastery * 100)}%`}

1. In the passage: weave in one sentence connecting "${weakestPrereq.name}" to ${subtopicName}.
2. One question must test this connection. Set its cognitiveLevel to "prerequisite_review" and conceptTag to the most relevant concept tag from the list above.
`
      : "";

    const retryHistoryContext = isRetry
      ? `━━━ STUDENT LEARNING HISTORY ━━━
Previous attempts: ${studentContext.previousAttempts}
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%
Last attempt score: ${studentContext.lastScorePercentage}%
Struggling with: ${studentContext.weakCognitiveLevels.join(", ") || "none identified"}
${prereqMasteryContext}
${wrongQuestionsContext}`
      : prereqMasteryContext
        ? `━━━ STUDENT KNOWLEDGE GRAPH STATE ━━━\n${prereqMasteryContext}`
        : "";

    const fallbackBloomsNote = !hasConceptData
      ? getBloomsDistribution(
          studentContext.previousAttempts === 0 && studentContext.prerequisiteMasteries.length > 0
            ? studentContext.prerequisiteMasteries.reduce((sum, p) => sum + p.mastery, 0) /
                studentContext.prerequisiteMasteries.length
            : studentContext.previousMastery,
          studentContext.previousAttempts,
        )
      : "";

    const userPrompt = `Generate a reading passage and 8 quiz questions for:

SUBTOPIC: ${subtopicName}
CHAPTER: ${topicId.replace(/_/g, " ")}
SUBJECT: ${subject}
CLASS: ${classLevel}
EXAM BOARD: NCERT (JEE/NEET relevant)

${retryHistoryContext}
${completedContext}
${conceptContext}
${forgettingContext}
${masteryLabelInstructions}

━━━ WHAT THIS SUBTOPIC COVERS ━━━
Focus ONLY on: ${keyConceptsSummary}

━━━ CLASS ${classLevel} STUDENT PROFILE ━━━
Vocabulary: ${profile.vocabulary}
Sentence style: ${profile.sentenceStyle}
Analogy domain: ${profile.analogyDomain}
Tone: ${profile.tone}
Concept depth: ${profile.conceptDepth}
Prior knowledge: ${profile.priorKnowledge}
Context: ${profile.examContext}

━━━ PASSAGE REQUIREMENTS ━━━
- Length: strictly 220-260 words
- Structure:
  1. Hook (1-2 sentences): surprising fact or real phenomenon
  2. Core concept (3-4 sentences): main idea of THIS subtopic clearly explained
  3. Mechanism or detail (3-4 sentences): how/why it works at the appropriate depth
  4. Indian real-world connection (2 sentences): where this appears in Indian industry or daily life
  5. Bridge to next (1 sentence): how mastering this connects to the next concept
- Every example must be Indian
- Terminology must match NCERT Class ${classLevel} exactly
${prereqReinforcementInstruction}
${allocationTable || fallbackBloomsNote}

━━━ QUESTION RULES ━━━
Question type descriptions:
${questionTypes.map((qt) => `${qt.level.toUpperCase()}: ${qt.instruction}`).join("\n")}

Each question:
- 4 options (A, B, C, D)
- One unambiguous correct answer
- Three distractors: real NCERT Chemistry concepts, plausible to an unprepared student, reflect common JEE/NEET misconceptions
- Explanation referencing the exact passage line
- difficulty: a float from 0.0 to 1.0 (0.2 = very easy, 0.5 = medium, 0.8 = very hard)
- conceptTag: must exactly match one of the tags from the CONCEPT MASTERY STATE above${!hasConceptData ? ` or use "${subtopicDef.id}_general"` : ""}

━━━ OUTPUT FORMAT ━━━
Return ONLY this JSON:
{
  "title": "engaging title max 8 words",
  "passage": "full passage text",
  "questions": [
    {
      "index": 0,
      "cognitiveLevel": "recall",
      "conceptTag": "tag_name",
      "difficulty": 0.25,
      "question": "question text",
      "options": ["A. text", "B. text", "C. text", "D. text"],
      "correctIndex": 0,
      "explanation": "explanation referencing passage"
    }
  ]
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 3500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const rawContent = response.content[0];
      if (rawContent.type !== "text") {
        throw new AppError(500, "Unexpected response from Claude");
      }

      const cleaned = rawContent.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      let parsed: {
        title: string;
        passage: string;
        questions: GeneratedQuestion[];
      };

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new AppError(500, "Claude returned invalid JSON — please retry");
      }

      if (
        !parsed.title ||
        !parsed.passage ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length !== 8
      ) {
        throw new AppError(500, "Claude returned incomplete content — please retry");
      }

      const missingFields = parsed.questions.some(
        (q) =>
          typeof q.conceptTag !== "string" ||
          q.conceptTag.length === 0 ||
          typeof q.difficulty !== "number",
      );
      if (missingFields) {
        throw new AppError(500, "Claude returned questions without required conceptTag or difficulty — please retry");
      }

      const shownQuestions = parsed.questions.slice(0, 5);

      const session = await prisma.session.create({
        data: {
          studentId,
          subtopicId,
          topicId: subtopicDef.topicId,
          neo4jTopicId: subtopicDef.topicId,
          classLevel,
          passage: parsed.passage,
          questions: shownQuestions,
          questionPool: parsed.questions,
          shownQuestions: [],
          pendingRetries: [],
          sessionStatus: "active",
          totalShown: 0,
          totalCorrect: 0,
        },
        include: { subtopic: true },
      });

      return {
        sessionId: session.id,
        title: parsed.title,
        passage: parsed.passage,
        questions: shownQuestions,
        subtopic: {
          id: session.subtopic.id,
          name: session.subtopic.name,
          order: session.subtopic.order,
          topicId: session.subtopic.topicId,
          classLevel: session.subtopic.classLevel,
          subject: session.subtopic.subject,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Content generation failed: ${(error as Error).message}`);
    }
  },

  async getSession(sessionId: string, studentId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { subtopic: true },
    });
    if (!session) throw new AppError(404, "Session not found");
    return session;
  },
};
