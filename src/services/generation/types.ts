import { AssemblySlot } from "../question.bank.service";
import { ConceptState } from "../concept.service";

// ─── Student context (input to the pipeline) ─────────────────────────────────

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

// ─── Generation outputs ──────────────────────────────────────────────────────

export type GeneratedPassage = {
  title: string;
  passage: string;
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

export interface QuestionSlot extends AssemblySlot {
  conceptName: string;
  isBackup: boolean;
}

export type PoolQuestion = GeneratedQuestion & { bankQuestionId?: string };

// ─── Coverage summary (chapter thread context) ───────────────────────────────

export type CoverageSummary = {
  examplesUsed: string[];
  conceptsCovered: string[];
  approachAngle: string;
  questionAngles: string;
};

// ─── Validation (LLM-judge) ──────────────────────────────────────────────────

export type ValidationResult = {
  conceptCoverage: number;
  answerability: number;
  keyCorrectness: number;
  distractorQuality: number;
  lengthReadability: number;
  issues: string[];
};

// ─── Subtopic summary returned to the client ─────────────────────────────────

export type SubtopicSummary = {
  id: string;
  name: string;
  order: number;
  topicId: string;
  classLevel: number;
  subject: string;
};

export type GenerationResult = {
  sessionId: string;
  title: string;
  passage: string;
  questions: PoolQuestion[];
  subtopic: SubtopicSummary;
  source: "bank" | "generated";
};

export type ReviewGenerationResult = {
  sessionId: string;
  title: string;
  passage: string;
  questions: GeneratedQuestion[];
  subtopicId: string;
  reviewedConceptCount: number;
  source: "generated";
};
