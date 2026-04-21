import { prisma } from "../db/prisma";

const PASSAGE_MIN_USES = 10;
const PASSAGE_MIN_SCORE = 0.35;
const QUESTION_MIN_ANSWERS = 30;
const QUESTION_MIN_DISCRIMINATION = 0.15;

export const qualityJob = {
  async retireLowQualityPassages(): Promise<{ retired: number }> {
    const candidates = await prisma.passageBank.findMany({
      where: {
        isActive: true,
        timesUsed: { gte: PASSAGE_MIN_USES },
        averageScore: { lt: PASSAGE_MIN_SCORE },
      },
      select: { id: true },
    });

    if (candidates.length === 0) return { retired: 0 };

    await prisma.passageBank.updateMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      data: { isActive: false },
    });

    return { retired: candidates.length };
  },

  async retireLowQualityQuestions(): Promise<{ retired: number }> {
    const candidates = await prisma.questionBank.findMany({
      where: {
        isActive: true,
        timesAnswered: { gte: QUESTION_MIN_ANSWERS },
        discriminationIndex: { lt: QUESTION_MIN_DISCRIMINATION },
      },
      select: { id: true },
    });

    if (candidates.length === 0) return { retired: 0 };

    await prisma.questionBank.updateMany({
      where: { id: { in: candidates.map((q) => q.id) } },
      data: { isActive: false },
    });

    return { retired: candidates.length };
  },

  async run(): Promise<{ passagesRetired: number; questionsRetired: number }> {
    const [passages, questions] = await Promise.all([
      this.retireLowQualityPassages(),
      this.retireLowQualityQuestions(),
    ]);

    return {
      passagesRetired: passages.retired,
      questionsRetired: questions.retired,
    };
  },
};

let jobInterval: ReturnType<typeof setInterval> | null = null;

export function startQualityJob(intervalMs = 6 * 60 * 60 * 1000): void {
  if (jobInterval) return;

  jobInterval = setInterval(() => {
    qualityJob.run().catch(() => {});
  }, intervalMs);
}

export function stopQualityJob(): void {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
  }
}
