import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { getSubtopicById } from "../data/subtopics";

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

const getBloomsDistribution = (mastery: number, attempts: number): string => {
  if (attempts === 0 || mastery < 0.3) {
    return `BLOOM'S QUESTION DISTRIBUTION FOR THIS STUDENT (mastery: ${Math.round(mastery * 100)}%):
Student is at foundational level. Weight toward easier question types:
- Q1: recall (easiest — build confidence)
- Q2: vocabulary (reinforce key terms)
- Q3: cause_and_effect (one step reasoning only)
- Q4: cause_and_effect (different angle, still accessible)
- Q5: application (one simple real scenario)
Avoid tricky inference. Student needs confidence first.`;
  }

  if (mastery < 0.6) {
    return `BLOOM'S QUESTION DISTRIBUTION FOR THIS STUDENT (mastery: ${Math.round(mastery * 100)}%):
Student is developing. Use balanced distribution:
- Q1: recall
- Q2: vocabulary
- Q3: cause_and_effect
- Q4: inference (push slightly)
- Q5: application (moderate scenario)
Standard difficulty — push gently on inference and application.`;
  }

  if (mastery < 0.8) {
    return `BLOOM'S QUESTION DISTRIBUTION FOR THIS STUDENT (mastery: ${Math.round(mastery * 100)}%):
Student has good mastery. Weight toward higher order thinking:
- Q1: recall (keep easy)
- Q2: cause_and_effect (skip easy vocabulary)
- Q3: inference (must require real reasoning)
- Q4: inference (different angle)
- Q5: application (complex multi-step scenario)
Make inference and application questions genuinely challenging.`;
  }

  return `BLOOM'S QUESTION DISTRIBUTION FOR THIS STUDENT (mastery: ${Math.round(mastery * 100)}%):
Student has high mastery. Push hard on higher order thinking:
- Q1: recall (just one easy one)
- Q2: inference (non-obvious)
- Q3: inference (harder, different angle)
- Q4: application (complex real scenario)
- Q5: application (edge case or exception)
This student should be challenged. Easy questions waste their time.`;
};

export const contentService = {
  async generatePassageAndQuestions(
    studentId: string,
    subtopicId: string,
    studentContext: {
      previousAttempts: number;
      previousMastery: number;
      weakCognitiveLevels: string[];
      prerequisiteGaps: string[];
      prerequisiteMasteries: Array<{
        name: string;
        topicId: string;
        mastery: number;
        attempts: number;
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
    },
  ) {
    // Get subtopic definition
    const subtopicDef = getSubtopicById(subtopicId);
    if (!subtopicDef)
      throw new AppError(404, `Subtopic ${subtopicId} not found`);

    const {
      classLevel,
      subject,
      name: subtopicName,
      keyConceptsSummary,
      topicId,
    } = subtopicDef;

    if (classLevel !== 11 && classLevel !== 12) {
      throw new AppError(400, "Only Class 11 and 12 supported");
    }

    const profile = gradeProfiles[classLevel];
    const isRetry = studentContext.previousAttempts > 0;

    const systemPrompt = `You are an expert Indian Chemistry teacher and JEE/NEET educator with 20 years of experience teaching NCERT Chemistry for Class 11 and 12.

Your job is to generate a focused reading passage and exactly 5 quiz questions on a SPECIFIC SUBTOPIC of a Chemistry chapter.

${
  isRetry
    ? `
⚠️ RETRY ATTEMPT — MANDATORY DIFFERENT CONTENT ⚠️
Student has attempted this subtopic ${studentContext.previousAttempts} time(s).
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%.
Weak question types: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}.
Prerequisite gaps: ${studentContext.prerequisiteGaps.join(", ") || "none"}.

YOU MUST generate a passage that:
1. Approaches the SAME subtopic from a completely different angle or application
2. Uses different Indian examples and scenarios than a standard first attempt
3. Focuses heavily on the weak question types: ${studentContext.weakCognitiveLevels.join(", ") || "inference and application"}
4. Does NOT repeat the standard textbook introduction to this subtopic
5. ${studentContext.lastScorePercentage >= 80 ? "Increases difficulty — student scored well, they need harder questions" : studentContext.lastScorePercentage >= 60 ? "Slightly increases difficulty — student is progressing" : "Addresses specific misconceptions from last attempt — student is struggling"}
${studentContext.wrongQuestions.length > 0 ? `6. Directly addresses these misconceptions: ${studentContext.wrongQuestions.map((q) => `"${q.chosenAnswer}" (wrong) vs "${q.correctAnswer}" (correct)`).join("; ")}` : ""}
`
    : ""
}

CRITICAL RULES:
1. The passage MUST be ONLY about the specific subtopic — do not drift to other subtopics
2. Every question must be answerable from the passage alone
3. Output ONLY valid JSON — no markdown, no backticks, no extra text
4. Use Indian context throughout — Indian names, Indian industries, Indian examples
5. Content must be NCERT-aligned and JEE/NEET relevant`;

    const completedContext =
      studentContext.completedSubtopicsInChapter.length > 0
        ? `
━━━ ALREADY COVERED IN THIS CHAPTER ━━━
The student has already completed these subtopics — do NOT re-explain these concepts:
${studentContext.completedSubtopicsInChapter.map((c, i) => `${i + 1}. ${c}`).join("\n")}
You may reference these briefly as prior knowledge but do not teach them again.
`
        : "";

    const difficultyInstruction = isRetry
      ? studentContext.lastScorePercentage >= 80
        ? "Student scored well last time. INCREASE difficulty significantly — fewer recall questions, more multi-step inference and application questions. Assume student knows the basics."
        : studentContext.lastScorePercentage >= 60
          ? "Student is developing. Generate questions at slightly higher difficulty — more cause_and_effect and inference, fewer recall questions."
          : "Student is struggling. Keep similar difficulty but use completely different examples and scenarios to help them see the concept from a new angle."
      : "";

    const wrongQuestionsContext =
      isRetry && studentContext.wrongQuestions.length > 0
        ? `
━━━ SPECIFIC MISCONCEPTIONS FROM LAST ATTEMPT ━━━
The student got these questions wrong. Your passage and questions MUST address these misconceptions directly:

${studentContext.wrongQuestions
  .map(
    (q, i) => `
MISCONCEPTION ${i + 1} [${q.cognitiveLevel}]:
Question: "${q.questionText}"
Student chose: "${q.chosenAnswer}"
Correct answer: "${q.correctAnswer}"
Why it matters: ${q.explanation}
`,
  )
  .join("")}

MANDATORY INSTRUCTIONS:
1. Your passage must contain content that would help a student NOT make these exact mistakes
2. Generate at least ${Math.min(studentContext.wrongQuestions.length, 2)} questions that test the same concepts as the wrong questions above, but worded differently
3. The student who chose the wrong answers above has a specific misconception — address it directly in the passage
`
        : "";

    const prereqMasteryContext =
      studentContext.prerequisiteMasteries.length > 0
        ? `
PREREQUISITE CHAPTER MASTERY (from student's knowledge graph):
${studentContext.prerequisiteMasteries
  .map((p) => {
    const status =
      p.attempts === 0
        ? "⚠️ NEVER ATTEMPTED"
        : p.mastery < 0.4
          ? `🔴 STRUGGLING (${Math.round(p.mastery * 100)}%)`
          : p.mastery < 0.6
            ? `🟡 DEVELOPING (${Math.round(p.mastery * 100)}%)`
            : `🟢 GOOD (${Math.round(p.mastery * 100)}%)`;
    return `  - ${p.name}: ${status}`;
  })
  .join("\n")}

${
  studentContext.prerequisiteGaps.length > 0
    ? `⚠️ WEAK PREREQUISITES: The student has gaps in ${studentContext.prerequisiteGaps.join(", ")}. Your passage MUST briefly reinforce the core connecting concept from the weakest prerequisite before diving deep into ${subtopicName}. Weave it naturally.`
    : "✅ Prerequisites are adequately mastered — go full depth on this subtopic."
}`
        : "";

    const retryContext = isRetry
      ? `
━━━ STUDENT LEARNING HISTORY ━━━
Previous attempts: ${studentContext.previousAttempts}
Current mastery: ${Math.round(studentContext.previousMastery * 100)}%
Last attempt score: ${studentContext.lastScorePercentage}%
Struggling with question types: ${studentContext.weakCognitiveLevels.join(", ") || "none identified"}
${prereqMasteryContext}

DIFFICULTY INSTRUCTION: ${difficultyInstruction}

MANDATORY: Choose a different angle, application, or example set than a standard introduction.
Weight your questions toward: ${studentContext.weakCognitiveLevels.length > 0 ? studentContext.weakCognitiveLevels.join(", ") : "inference and application"}
${wrongQuestionsContext}
`
      : prereqMasteryContext
        ? `
━━━ STUDENT KNOWLEDGE GRAPH STATE ━━━
${prereqMasteryContext}
`
        : "";
    const weakestPrereq = studentContext.prerequisiteMasteries
      .filter((p) => p.attempts === 0 || p.mastery < 0.5)
      .sort((a, b) => a.mastery - b.mastery)[0];

    const prereqReinforcementInstruction = weakestPrereq
      ? `
━━━ PREREQUISITE REINFORCEMENT — MANDATORY ━━━
The student's weakest prerequisite is: "${weakestPrereq.name}"
Status: ${weakestPrereq.attempts === 0 ? "NEVER ATTEMPTED" : `mastery ${Math.round(weakestPrereq.mastery * 100)}%`}

YOU MUST do two things:
1. In the passage — weave in one sentence that connects a concept from "${weakestPrereq.name}" to ${subtopicName}. Make it natural, not forced.
2. Replace Q3 with a question that tests the connecting concept between "${weakestPrereq.name}" and ${subtopicName}. This question must still be answerable from the passage. Set its cognitiveLevel to "prerequisite_review".

This is the knowledge graph actively personalizing learning for this student.
`
      : "";

    const userPrompt = `Generate a reading passage and 5 quiz questions for:

SUBTOPIC: ${subtopicName}
CHAPTER: ${topicId.replace(/_/g, " ")}
SUBJECT: ${subject}
CLASS: ${classLevel}
EXAM BOARD: NCERT (JEE/NEET relevant)
${retryContext}
${completedContext}
━━━ WHAT THIS SUBTOPIC COVERS ━━━
Focus ONLY on these concepts: ${keyConceptsSummary}

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
  1. Hook (1-2 sentences): surprising fact or real phenomenon about this subtopic
  2. Core concept (3-4 sentences): the main idea of THIS subtopic clearly explained
  3. Mechanism or detail (3-4 sentences): how/why it works at the appropriate depth
  4. Indian real-world connection (2 sentences): where this subtopic appears in Indian industry, medicine, or daily life
  5. Bridge to next (1 sentence): how mastering this subtopic connects to the next concept in the chapter
- Every example must be Indian — Indian industries, Indian scientists where relevant, Indian daily life
- Terminology must match NCERT Class ${classLevel} exactly
${prereqReinforcementInstruction}
━━━ QUESTION REQUIREMENTS ━━━
${getBloomsDistribution(
  studentContext.previousAttempts === 0 &&
    studentContext.prerequisiteMasteries.length > 0
    ? studentContext.prerequisiteMasteries.reduce(
        (sum, p) => sum + p.mastery,
        0,
      ) / studentContext.prerequisiteMasteries.length
    : studentContext.previousMastery,
  studentContext.previousAttempts === 0 &&
    studentContext.prerequisiteMasteries.length > 0
    ? studentContext.prerequisiteMasteries.filter((p) => p.attempts > 0).length
    : studentContext.previousAttempts,
)}

Follow this distribution when choosing cognitive levels. The question type descriptions:
${questionTypes.map((qt, i) => `${qt.level.toUpperCase()}: ${qt.instruction}`).join("\n")}

Each question:
- 4 options (A, B, C, D)
- One unambiguous correct answer
- Three distractors that are real Chemistry concepts — plausible to an unprepared student
- Explanation referencing the exact passage line

━━━ DISTRACTOR RULES ━━━
- Every wrong option must be a real concept from NCERT Class ${classLevel} Chemistry
- Distractors must reflect common JEE/NEET misconceptions
- Never use absurd options
- At least 2 options should be genuinely tempting

━━━ OUTPUT FORMAT ━━━
Return ONLY this JSON:
{
  "title": "engaging title max 8 words",
  "passage": "full passage text",
  "questions": [
    {
      "index": 0,
      "cognitiveLevel": "recall",
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
        max_tokens: 2000,
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
        questions: Array<{
          index: number;
          cognitiveLevel: string;
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;
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
        parsed.questions.length !== 5
      ) {
        throw new AppError(
          500,
          "Claude returned incomplete content — please retry",
        );
      }

      // Create session in Postgres
      const session = await prisma.session.create({
        data: {
          studentId,
          subtopicId,
          topicId: subtopicDef.topicId,
          neo4jTopicId: subtopicDef.topicId,
          classLevel,
          passage: parsed.passage,
          questions: parsed.questions,
        },
        include: { subtopic: true },
      });

      return {
        sessionId: session.id,
        title: parsed.title,
        passage: parsed.passage,
        questions: parsed.questions,
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
      throw new AppError(
        500,
        `Content generation failed: ${(error as Error).message}`,
      );
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
