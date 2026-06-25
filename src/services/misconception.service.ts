import { prisma } from "../db/prisma";

export interface MisconceptionRecord {
  conceptTag: string;
  belief: string;
  why: string;
}

export const misconceptionService = {
  async getForConceptTags(tags: string[]): Promise<MisconceptionRecord[]> {
    if (tags.length === 0) return [];

    const rows = await prisma.misconception.findMany({
      where: { conceptTag: { in: tags } },
      select: { conceptTag: true, belief: true, why: true },
    });

    return rows;
  },

  formatForPrompt(records: MisconceptionRecord[]): string {
    if (records.length === 0) return "";

    const grouped = new Map<string, MisconceptionRecord[]>();
    for (const row of records) {
      const list = grouped.get(row.conceptTag) ?? [];
      list.push(row);
      grouped.set(row.conceptTag, list);
    }

    const lines = ["━━━ COMMON STUDENT MISCONCEPTIONS (use for distractors) ━━━"];
    for (const [tag, items] of grouped) {
      lines.push(`\n[${tag}]`);
      for (const item of items) {
        lines.push(`- Belief: ${item.belief}`);
        lines.push(`  Why wrong: ${item.why}`);
      }
    }
    return lines.join("\n");
  },
};
