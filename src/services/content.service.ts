import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ─── Grade Calibration Profiles ──────────────────────────────────────────────

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
  6: {
    vocabulary:
      "simple everyday words only — if a scientific term is introduced, immediately explain it in brackets using a household analogy",
    sentenceStyle:
      'short and crisp sentences, maximum 12-15 words each, use simple conjunctions like "because", "so", "and", "but"',
    analogyDomain:
      "household objects, food, playground, animals, things a 11-year-old sees daily",
    tone: 'warm and curious, like a friendly teacher telling a story — start with "Have you ever noticed..." or "Did you know..."',
    conceptDepth:
      "purely observational and descriptive — what happens, not why at a molecular level. No formulas, no complex processes",
    priorKnowledge:
      "only basic primary school knowledge — assume the student knows nothing beyond Class 5",
    examContext: "Class 6 NCERT Science — first year of middle school",
  },
  7: {
    vocabulary:
      "introduce subject-specific terms but always define them inline the first time they appear",
    sentenceStyle:
      "mix of short and medium sentences, occasionally compound sentences are fine",
    analogyDomain:
      "school environment, sports, cooking, nature, body functions they can feel",
    tone: 'exploratory and slightly more formal — "Let us understand...", "Think about what happens when..."',
    conceptDepth:
      "cause and effect relationships — not just what happens but a simple why. One level of reasoning",
    priorKnowledge:
      "Class 6 NCERT Science topics — student knows basic classification, simple observations",
    examContext: "Class 7 NCERT Science — building on Class 6 foundations",
  },
  8: {
    vocabulary:
      "subject terminology used freely — do not over-explain basic terms but define advanced ones",
    sentenceStyle:
      "medium to longer sentences, more complex structures allowed",
    analogyDomain:
      "technology, body functions, real world applications like factories, hospitals, agriculture",
    tone: 'informative and process-driven — "The process works as follows...", "This mechanism is responsible for..."',
    conceptDepth:
      "mechanisms and processes — explain how things work step by step, multi-level reasoning allowed",
    priorKnowledge:
      "Class 6-7 NCERT Science — student understands basic biology, chemistry changes, motion concepts",
    examContext:
      "Class 8 NCERT Science — bridge year before high school science",
  },
  9: {
    vocabulary:
      'full scientific terminology aligned with NCERT Class 9 — terms like "inertia", "diffusion", "mitosis" used without excessive handholding',
    sentenceStyle:
      "varied sentence length — mix short punchy statements with longer explanatory ones",
    analogyDomain:
      "everyday phenomena explained scientifically — why sky is blue, how brakes work, why we sweat",
    tone: "academic but engaging — connects every concept to an observable phenomenon the student has experienced",
    conceptDepth:
      "laws, principles, and definitions introduced verbally — equations can be mentioned in word form, interconnections between topics highlighted",
    priorKnowledge:
      "Class 6-8 NCERT Science — student has solid foundation in basic biology, chemistry, and physics",
    examContext:
      "Class 9 NCERT Science — first year of high school, foundation for board exams",
  },
  10: {
    vocabulary:
      "complete scientific language — board exam aligned terminology, precise definitions expected",
    sentenceStyle:
      "varied, includes technical descriptions, classification and comparison sentences",
    analogyDomain:
      "real world applications, career relevance (medicine, engineering, environment), global implications",
    tone: "precise and exam-aware — every sentence adds information, no fluff, connects to broader scientific understanding",
    conceptDepth:
      "full conceptual depth — mechanisms, exceptions, interconnections between chapters, implications and applications",
    priorKnowledge:
      "Class 6-9 NCERT Science — complete middle school foundation assumed",
    examContext:
      "Class 10 NCERT Science — board exam year, highest rigor required",
  },
};

// ─── Bloom's Taxonomy Question Types ─────────────────────────────────────────

const questionTypes = [
  {
    level: "recall",
    instruction:
      "Test direct recall — the answer must be explicitly stated in the passage. This is the easiest question.",
  },
  {
    level: "vocabulary",
    instruction:
      "Test understanding of a specific scientific term used in the passage — ask what it means or what it refers to.",
  },
  {
    level: "cause_and_effect",
    instruction:
      "Test cause and effect reasoning — ask why something happens or what causes a specific outcome mentioned in the passage.",
  },
  {
    level: "inference",
    instruction:
      "Test inference — the answer is NOT directly stated but logically follows from what the passage describes. The student must think one step beyond.",
  },
  {
    level: "application",
    instruction:
      "Test application — give a real world scenario and ask what would happen based on the concept explained in the passage.",
  },
];

// ─── Main Generation Function ─────────────────────────────────────────────────

export const contentService = {
  async generatePassageAndQuestions(
    studentId: string,
    topicId: string,
    topicName: string,
    subject: string,
    classLevel: number,
  ) {
    // Validate classLevel
    if (classLevel < 6 || classLevel > 10) {
      throw new AppError(400, "Class level must be between 6 and 10");
    }

    const profile = gradeProfiles[classLevel];

const systemPrompt = `You are an expert Indian school science teacher and curriculum designer with 20 years of experience teaching NCERT Science from Class 6 to Class 10.

Your job is to generate a reading passage and exactly 5 quiz questions for a student.

You have a deep understanding of:
- The exact NCERT Science curriculum for each class from 6 to 10
- The cognitive development stage of students at each class level
- Age-appropriate language, analogies, and examples for Indian school students
- Bloom's Taxonomy — your questions always progress from recall to application
- What concepts a student at each class level has already studied and what is new

CRITICAL RULES YOU MUST NEVER BREAK:
1. The passage must be written SPECIFICALLY for a Class ${classLevel} student — not simpler, not harder
2. Every question must be answerable using ONLY the passage — no outside knowledge required
3. The correct answer must be unambiguous — only one option can be correct
4. Distractors (wrong options) must be plausible but clearly wrong to a student who read the passage carefully
5. The explanation must reference the exact part of the passage that contains the answer
6. Output ONLY valid JSON — no markdown, no backticks, no preamble, no extra text whatsoever
7. The passage must follow Indian context — use Indian examples, Indian names, Indian scenarios where possible`;

const userPrompt = `Generate a reading passage and 5 quiz questions for the following:

TOPIC: ${topicName}
SUBJECT: ${subject}
CLASS LEVEL: Class ${classLevel}
EXAM BOARD: NCERT (Indian curriculum)

━━━ CLASS ${classLevel} STUDENT PROFILE ━━━
Vocabulary style: ${profile.vocabulary}
Sentence style: ${profile.sentenceStyle}
Analogy domain: ${profile.analogyDomain}
Tone: ${profile.tone}
Concept depth: ${profile.conceptDepth}
Prior knowledge: ${profile.priorKnowledge}
Context: ${profile.examContext}

━━━ PASSAGE REQUIREMENTS ━━━
- Length: strictly 200-250 words
- Structure must follow this exact order:
  1. Hook (1-2 sentences): a surprising fact or relatable question about ${topicName}
  2. Core concept (3-4 sentences): what ${topicName} is, clearly explained for Class ${classLevel}
  3. Process or mechanism (3-4 sentences): how or why it works — depth appropriate for Class ${classLevel}
  4. Real world connection (2 sentences): where does a Class ${classLevel} Indian student encounter this in daily life
  5. Closing thought (1 sentence): a thought-provoking statement that is specific to ${topicName} — connect it to something the student will encounter in a higher class or in real Indian life — never generic, always topic-specific
- Use Indian context: Indian names, Indian food, Indian geography, Indian daily life examples
- Every scientific term introduced must match Class ${classLevel} NCERT Science terminology exactly

━━━ QUESTION REQUIREMENTS ━━━
Generate exactly 5 questions following Bloom's Taxonomy progression:
${questionTypes.map((qt, i) => `Q${i + 1} — ${qt.level.toUpperCase()}: ${qt.instruction}`).join("\n")}

Each question must have:
- Exactly 4 options labeled A, B, C, D
- One unambiguously correct answer
- Three plausible distractors that a student who did NOT read carefully might choose
- A concise explanation (1-2 sentences) referencing the passage

━━━ DISTRACTOR QUALITY RULES ━━━
- Every wrong option must be a real concept from the same NCERT chapter or an adjacent chapter
- Wrong options must reflect common misconceptions students have about ${topicName}
- Never use obviously absurd or trivially wrong options
- A student who studied the chapter but did NOT read this passage carefully should find at least 2 options genuinely believable
- Never repeat the same distractor pattern across questions

━━━ OUTPUT FORMAT ━━━
Return ONLY this exact JSON structure with no extra text:
{
  "title": "engaging title for this passage (max 8 words)",
  "passage": "full passage text here",
  "questions": [
    {
      "index": 0,
      "cognitiveLevel": "recall",
      "question": "question text",
      "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
      "correctIndex": 0,
      "explanation": "explanation referencing the passage"
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

      // Extract text content
      const rawContent = response.content[0];
      if (rawContent.type !== "text") {
        throw new AppError(500, "Unexpected response type from Claude");
      }

      // Parse JSON — strip any accidental markdown if present
      const cleanedContent = rawContent.text
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
        parsed = JSON.parse(cleanedContent);
      } catch {
        throw new AppError(500, "Claude returned invalid JSON — please retry");
      }

      // Validate structure
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

      // Find or create topic in Postgres
      const topic = await prisma.topic.upsert({
        where: {
          name_subject_classLevel: {
            name: topicName,
            subject,
            classLevel,
          },
        },
        update: {},
        create: { name: topicName, subject, classLevel },
      });

      // Create session in Postgres
      const session = await prisma.session.create({
        data: {
          studentId,
          topicId: topic.id,
          neo4jTopicId: topicId, // topicId param is already the Neo4j id
          classLevel,
          passage: parsed.passage,
          questions: parsed.questions,
        },
        include: { topic: true },
      });

      return {
        sessionId: session.id,
        title: parsed.title,
        passage: parsed.passage,
        questions: parsed.questions,
        topic: session.topic,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        `Content generation failed: ${(error as Error).message}`,
      );
    }
  },

  // Fetch an existing session (so we don't regenerate on page refresh)
  async getSession(sessionId: string, studentId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, studentId },
      include: { topic: true },
    });

    if (!session) {
      throw new AppError(404, "Session not found");
    }

    return session;
  },
};
