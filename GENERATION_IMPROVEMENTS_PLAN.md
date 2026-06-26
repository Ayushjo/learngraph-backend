# Generation Improvements Plan
## Structured Tool Output + Chapter Thread Context

---

## Overview

Two related improvements to the AI generation pipeline:

1. **Structured Tool Output** — replace fragile JSON-from-text parsing with Claude's native tool_use feature
2. **Chapter Thread Context** — store a compact summary after each generation so future generations in the same chapter have real context, not just subtopic names

These two are implemented together since they both touch `content.service.ts` and the generation flow.

---

## Problem 1 — Fragile JSON Parsing

### Current state

Every generation call (passage, questions, review passage) ends with:

```typescript
const cleaned = rawContent.text
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();

let parsed: { title: string; passage: string };
try {
  parsed = JSON.parse(cleaned);
} catch {
  throw new AppError(500, "Claude returned invalid JSON — please retry");
}
```

The system prompt also contains `"Output ONLY valid JSON — no markdown, no backticks, no extra text"` — and then hopes Claude complies.

This breaks silently when Claude adds a preamble sentence, wraps in markdown, or returns malformed JSON on edge cases.

### Fix — Claude Tool Use

Define tool schemas in JSON config files. Pass the tool with `tool_choice: { type: "tool", name: "..." }` to force Claude to always return structured output. Response arrives as a pre-parsed object — no regex, no JSON.parse, no retry on malformed output.

```typescript
// Before
const cleaned = rawContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
const parsed = JSON.parse(cleaned); // can throw

// After
const toolCall = response.content.find(b => b.type === "tool_use");
const parsed = toolCall.input as { title: string; passage: string }; // already valid
```

---

## Problem 2 — No Real Chapter Context

### Current state

When generating subtopic 2 in a chapter, the prompt includes:

```
━━━ ALREADY COVERED IN THIS CHAPTER ━━━
The student has already completed these — do NOT re-explain:
1. Ionic Bonding
2. Covalent Bonding
```

Only the **name** is sent. Claude doesn't know:
- What example was used in Ionic Bonding (NaCl? MgO?)
- What questions were asked
- What the student got wrong

For retries, the prompt says `"approach from a completely different angle"` — but Claude doesn't know what the previous angle was.

### Fix — Generation Summary on Session

After each generation, run a small summary call (Haiku, ~50 tokens in, ~100 tokens out). Store the result in `Session.generationSummary`. On the next subtopic or retry, fetch previous session summaries for that chapter and inject them as real context.

**Summary format (per subtopic, ~100-120 tokens):**
```
Subtopic: Ionic Bonding | Attempt: 1
Examples used: NaCl electron transfer, Born-Haber cycle
Concepts covered: cation/anion formation, lattice energy direction, ionic compound properties
Question angles: recall×2, cause_and_effect×2, application×1, inference×2, backup×1
Result: 6/8 correct | Wrong: Q3 lattice energy direction (confused ΔH sign)
```

5 subtopics per chapter = ~600 tokens of real context. Sent to a Haiku model = effectively free.

---

## Schema Change

One new field on `Session`:

```prisma
model Session {
  // ... all existing fields unchanged ...
  generationSummary  String?   // compact summary written after generation
}
```

Migration: `npx prisma migrate dev --name add_session_generation_summary`

Existing rows get `null` — fully backwards compatible.

---

## New Files

```
src/
  config/
    tools/
      passage-generation.tool.json     ← tool schema for passage + title
      question-generation.tool.json    ← tool schema for 8 questions
      coverage-summary.tool.json       ← tool schema for post-generation summary
```

### `passage-generation.tool.json`

```json
{
  "name": "submit_passage",
  "description": "Submit the generated reading passage and title",
  "input_schema": {
    "type": "object",
    "properties": {
      "title":   { "type": "string", "description": "Engaging title, max 8 words" },
      "passage": { "type": "string", "description": "Full passage text, 220-260 words" }
    },
    "required": ["title", "passage"]
  }
}
```

### `question-generation.tool.json`

```json
{
  "name": "submit_questions",
  "description": "Submit exactly 8 quiz questions for the passage",
  "input_schema": {
    "type": "object",
    "properties": {
      "questions": {
        "type": "array",
        "minItems": 8,
        "maxItems": 8,
        "items": {
          "type": "object",
          "properties": {
            "index":          { "type": "integer", "minimum": 0, "maximum": 7 },
            "cognitiveLevel": { "type": "string", "enum": ["recall", "vocabulary", "cause_and_effect", "inference", "application", "prerequisite_review"] },
            "conceptTag":     { "type": "string" },
            "difficulty":     { "type": "number", "minimum": 0.0, "maximum": 1.0 },
            "question":       { "type": "string" },
            "options":        { "type": "array", "items": { "type": "string" }, "minItems": 4, "maxItems": 4 },
            "correctIndex":   { "type": "integer", "minimum": 0, "maximum": 3 },
            "explanation":    { "type": "string" }
          },
          "required": ["index", "cognitiveLevel", "conceptTag", "difficulty", "question", "options", "correctIndex", "explanation"]
        }
      }
    },
    "required": ["questions"]
  }
}
```

### `coverage-summary.tool.json`

```json
{
  "name": "submit_coverage_summary",
  "description": "Submit a compact summary of this generation for future context injection",
  "input_schema": {
    "type": "object",
    "properties": {
      "examplesUsed":    { "type": "array", "items": { "type": "string" }, "description": "Indian examples used in the passage" },
      "conceptsCovered": { "type": "array", "items": { "type": "string" }, "description": "Key concepts explained" },
      "approachAngle":   { "type": "string", "description": "One sentence describing the angle/framing used" },
      "questionAngles":  { "type": "string", "description": "Brief summary of cognitive levels and concept angles tested" }
    },
    "required": ["examplesUsed", "conceptsCovered", "approachAngle", "questionAngles"]
  }
}
```

---

## Changes to `content.service.ts`

### 1. Import tool schemas

```typescript
import passageTool from "../config/tools/passage-generation.tool.json";
import questionTool from "../config/tools/question-generation.tool.json";
import summaryTool from "../config/tools/coverage-summary.tool.json";
```

### 2. Replace passage generation call

```typescript
// Remove: system prompt instruction "Output ONLY valid JSON — no markdown"
// Remove: .replace(/```json\n?/g, "") cleaning
// Remove: try { JSON.parse(cleaned) } catch

const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 800,
  tools: [passageTool],
  tool_choice: { type: "tool", name: "submit_passage" },
  system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: [{ type: "text", text: passageOnlyPrompt, cache_control: { type: "ephemeral" } }] }],
});

const toolCall = response.content.find(b => b.type === "tool_use");
if (!toolCall || toolCall.type !== "tool_use") throw new AppError(500, "Passage generation failed");
const parsed = toolCall.input as { title: string; passage: string };
```

### 3. Replace question generation call (same pattern in `generateQuestionsForPassage`)

Same swap — `tools: [questionTool]`, `tool_choice: { type: "tool", name: "submit_questions" }`, extract from `toolCall.input`.

### 4. Add `generateCoverageSummary()` function

New private function. Called after generation, non-blocking (fire and forget via `.catch(console.error)`).

```typescript
async function generateCoverageSummary(
  subtopicName: string,
  attemptNumber: number,
  passage: string,
  questions: GeneratedQuestion[],
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    tools: [summaryTool],
    tool_choice: { type: "tool", name: "submit_coverage_summary" },
    messages: [{
      role: "user",
      content: `Summarize this generation for future context.
Subtopic: ${subtopicName} | Attempt: ${attemptNumber}
Passage: ${passage}
Questions generated: ${questions.map(q => `[${q.cognitiveLevel}] ${q.conceptTag}`).join(", ")}`
    }],
  });

  const toolCall = response.content.find(b => b.type === "tool_use");
  if (!toolCall || toolCall.type !== "tool_use") return "";

  const s = toolCall.input as {
    examplesUsed: string[];
    conceptsCovered: string[];
    approachAngle: string;
    questionAngles: string;
  };

  return `Subtopic: ${subtopicName} | Attempt: ${attemptNumber}
Examples used: ${s.examplesUsed.join(", ")}
Concepts covered: ${s.conceptsCovered.join(", ")}
Approach: ${s.approachAngle}
Questions: ${s.questionAngles}`;
}
```

### 5. Add `buildChapterThreadContext()` function

Fetches previous completed sessions for the same chapter and builds a context block.

```typescript
async function buildChapterThreadContext(
  studentId: string,
  chapterId: string,
  excludeSubtopicId?: string,
): Promise<string> {
  const sessions = await prisma.session.findMany({
    where: {
      studentId,
      topicId: chapterId,
      sessionStatus: "completed",
      generationSummary: { not: null },
      ...(excludeSubtopicId ? { NOT: { subtopicId: excludeSubtopicId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { generationSummary: true, totalCorrect: true, totalShown: true },
  });

  if (sessions.length === 0) return "";

  const lines = sessions.map(s => {
    const score = s.totalShown > 0
      ? `${s.totalCorrect}/${s.totalShown} correct`
      : "result pending";
    return `${s.generationSummary}\nResult: ${score}`;
  });

  return `━━━ CHAPTER GENERATION HISTORY ━━━
What has already been generated and shown to this student in this chapter:
${lines.join("\n\n---\n")}

INSTRUCTIONS:
- Do NOT reuse examples listed above
- Do NOT re-explain concepts marked as already covered
- Build on prior knowledge — student has already seen the above`;
}
```

### 6. Inject chapter context into generation prompt

In `generatePassageAndQuestions`, after fetching concept states:

```typescript
const chapterContext = await buildChapterThreadContext(studentId, topicId, subtopicId);
```

Add `${chapterContext}` to `passageOnlyPrompt` (before the PASSAGE REQUIREMENTS block).

For retries, also fetch previous attempts for the same subtopic:

```typescript
const retryHistorySessions = await prisma.session.findMany({
  where: { studentId, subtopicId, sessionStatus: "completed", generationSummary: { not: null } },
  orderBy: { createdAt: "asc" },
  select: { generationSummary: true, totalCorrect: true, totalShown: true },
});
```

And include as "PREVIOUS ATTEMPTS ON THIS SUBTOPIC" — Claude sees exactly what was tried before.

### 7. Store summary after generation (fire and forget)

After `session.create(...)`:

```typescript
generateCoverageSummary(subtopicName, studentContext.previousAttempts + 1, parsed.passage, generatedQuestions)
  .then(summary => {
    if (summary) {
      prisma.session.update({ where: { id: session.id }, data: { generationSummary: summary } }).catch(() => {});
    }
  })
  .catch(() => {});
```

Non-blocking — does not affect response latency.

---

## Files Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `generationSummary String?` to `Session` model |
| `src/config/tools/passage-generation.tool.json` | New file |
| `src/config/tools/question-generation.tool.json` | New file |
| `src/config/tools/coverage-summary.tool.json` | New file |
| `src/services/content.service.ts` | Switch to tool_use for passage + questions; add `generateCoverageSummary()`; add `buildChapterThreadContext()`; inject context into prompts |
| `tsconfig.json` | Ensure `"resolveJsonModule": true` is set (likely already is) |

No route changes. No controller changes. No frontend changes.

---

## What This Unlocks

### Immediate (after this PR)

- Zero JSON parsing failures in production
- Retry quality: Claude knows what example was used last time, uses a different one
- Chapter coherence: subtopic 3 won't re-explain NaCl if subtopic 1 already used it

### Future (no extra work)

- The `generationSummary` field feeds into the review system — review sessions can check what was previously covered
- When we implement HLR-style model training, summaries are a rich feature source alongside `ConceptMasteryEvent`

---

## Testing

1. Run migration: `npx prisma migrate dev --name add_session_generation_summary`
2. Generate a session for subtopic 1 in a chapter — verify `Session.generationSummary` is populated within ~2 seconds of session creation
3. Generate subtopic 2 in the same chapter — verify `CHAPTER GENERATION HISTORY` block appears in the Claude prompt (add a `console.log` of `passageOnlyPrompt` temporarily)
4. Force a retry on subtopic 1 — verify the previous attempt summary appears in the retry prompt
5. Check that a passage generation failure (kill API key temporarily) throws `AppError(500)` as before
