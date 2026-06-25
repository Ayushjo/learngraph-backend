import { prisma } from "../../db/prisma";

interface SummarySession {
  subtopicId: string;
  generationSummary: string | null;
  totalCorrect: number;
  totalShown: number;
}

function formatSession(s: SummarySession): string {
  const score = s.totalShown > 0 ? `${s.totalCorrect}/${s.totalShown} correct` : "result pending";
  return `${s.generationSummary}\nResult: ${score}`;
}

/**
 * Chapter thread context (A5).
 *
 * Pulls the coverage summaries of every completed session in this chapter and
 * splits them into:
 *   1. Prior attempts on THIS subtopic — so a retry sees what was actually tried.
 *   2. Other subtopics in the chapter — so the model doesn't repeat examples/concepts.
 *
 * Returns "" when there is no prior history. Cheap: one indexed query, summaries
 * are ~100 tokens each.
 */
export async function buildChapterThreadContext(
  studentId: string,
  chapterId: string,
  subtopicId: string,
): Promise<string> {
  const sessions = await prisma.session.findMany({
    where: {
      studentId,
      topicId: chapterId,
      sessionStatus: "complete",
      generationSummary: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: { subtopicId: true, generationSummary: true, totalCorrect: true, totalShown: true },
  });

  if (sessions.length === 0) return "";

  const sameSubtopic = sessions.filter((s) => s.subtopicId === subtopicId);
  const otherSubtopics = sessions.filter((s) => s.subtopicId !== subtopicId);

  const blocks: string[] = [];

  if (sameSubtopic.length > 0) {
    blocks.push(`━━━ PREVIOUS ATTEMPTS ON THIS SUBTOPIC ━━━
The student has already seen these for this exact subtopic. Generate genuinely different
content — new examples, new framing, and target what they got wrong:
${sameSubtopic.map(formatSession).join("\n\n---\n")}`);
  }

  if (otherSubtopics.length > 0) {
    blocks.push(`━━━ CHAPTER GENERATION HISTORY ━━━
Already generated and shown to this student earlier in this chapter. Do NOT reuse these
examples and do NOT re-explain these concepts — build on them:
${otherSubtopics.map(formatSession).join("\n\n---\n")}`);
  }

  return blocks.join("\n\n");
}
