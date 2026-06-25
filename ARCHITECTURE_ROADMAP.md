# Learngraph — Architecture & Quality Roadmap

> Goal: move from "it works" to production-grade, and make the generated passages
> and questions genuinely the best possible for each student. This document is a
> full spec — each task has an owner, file references, and acceptance criteria so
> it can be picked up cold.

---

## Where we are today (honest diagnosis)

Read this first. It frames every task below.

1. **The memory model is strong; the generation pipeline is the weak link.**
   `concept.service.ts` (FSRS-lite: `halfLifeDays` / `easeFactor` / `conceptDifficulty`,
   velocity EMA, per-cognitive-level scoring, append-only `ConceptMasteryEvent`) is
   production-grade. But `content.service.ts` is a **1,131-line god file** with inline
   prompt strings, fragile `JSON.parse()` of model text, and no validation of output.
   This one file caps both quality and parallel work.

2. **Our "knowledge graph" is only a topic tree.** Neo4j holds `Topic` nodes +
   `REQUIRES`/`RELATED_TO` edges. All the richness — `Concept`, `ConceptMastery`,
   per-concept FSRS state — lives only in Postgres. Concepts have no prerequisite edges
   to each other and no cross-topic links. The graph that is supposed to be our moat is
   the coarsest part of the system.

3. **No quality feedback loop on generated content.** `PassageBank.averageScore` is
   computed from question correctness — which conflates "good passage" with "easy
   questions." Nothing checks: does the passage cover the target concepts? are questions
   answerable from the passage? is the marked-correct answer actually correct? are
   distractors real misconceptions?

4. **No observability.** No logging of token usage, latency, bank-hit rate, validation
   failures, or quality over time. We can't tell whether a change made things better.

---

## Ownership map

| Pillar | Owner | Theme |
|---|---|---|
| **A — Generation Pipeline** | You | Break up the god file; config-driven prompts; tool output; validator stage; chapter thread context |
| **B — Knowledge Graph Depth** | Backend coworker | Concepts + concept-prereqs in Neo4j; misconception taxonomy; eval harness; observability |
| **C — Surface the Science** | Frontend coworker | Concept-level graph viz; forgetting curves; quality/insight chips; engagement-signal capture |

The pillars are loosely coupled. The one hard dependency: Pillar C's concept-graph view
needs Pillar B's Neo4j concept nodes. Everything else can proceed in parallel.

---

# PILLAR A — Generation Pipeline (Owner: You)

### Target architecture

Every generation (first attempt, retry, review) flows through identical, observable stages:

```
ContextBuilder  →  PromptAssembler  →  Generator(tool-use)  →  Validator  →  Persister  →  Summarizer
   (student         (versioned          (typed output,         (LLM-judge   (bank +        (coverage
    state +          prompt from         no JSON.parse)         + rules)      session)       summary for
    chapter          config)                                                                 next gen)
    thread)
```

Each stage is a file under `src/services/generation/`. Each is independently testable.
This is the "smooth flow" we want — one path, every stage logged.

---

### A1. Config-driven prompts  `[M]`

**Why:** Prompts are 600+ lines of inline template literals inside `content.service.ts`.
We can't version them, A/B test them, or know which prompt produced a given passage.

**Do:**
- Create `src/config/prompts/`:
  - `passage.prompt.ts` — exports `{ version: "passage-v1", system, buildUser(ctx) }`
  - `questions.prompt.ts` — `{ version: "questions-v1", system, buildUser(ctx) }`
  - `review.prompt.ts` — `{ version: "review-v1", system, buildUser(ctx) }`
- Move all prompt-building helpers (`buildConceptContext`, `buildForgettingContext`,
  `buildMasteryLabelInstructions`, `buildAllocationTable`, `getBloomsDistribution`,
  the grade profiles) into `src/config/prompts/blocks.ts`.
- Add a `promptVersion String?` column to `Session` and stamp it on every generated session.

**Acceptance:**
- `content.service.ts` no longer contains any prompt string literal.
- A generated `Session` row records which prompt version produced it.
- Changing a prompt is a one-file edit with a bumped version string.

**Files:** `content.service.ts` (lines 12–296 = all the prompt blocks; 620–776, 996–1047 = the inline prompts), `schema.prisma` (Session model).

---

### A2. Structured tool output  `[S]`

**Why:** Three places do `text.replace(/```json/...).trim()` then `JSON.parse()` in a
try/catch (`content.service.ts:434, 806, 1058`). This silently fails when the model adds
a preamble or malformed JSON.

**Do:** Use Claude tool_use with forced `tool_choice`. (Full schemas already specced in
`GENERATION_IMPROVEMENTS_PLAN.md`.) Add `src/config/tools/`:
- `passage-generation.tool.json`
- `question-generation.tool.json`
- `coverage-summary.tool.json`

Replace each generation call:
```ts
// before: const parsed = JSON.parse(cleaned)  // can throw
// after:
const tool = res.content.find(b => b.type === "tool_use");
const parsed = tool.input as PassageOutput;   // schema-validated, always an object
```

**Acceptance:** Zero `JSON.parse` of model output anywhere. Forcing a malformed-output
scenario no longer throws a parse error.

**Files:** `content.service.ts`, new `src/config/tools/*.json`. Ensure
`"resolveJsonModule": true` in `tsconfig.json`.

---

### A3. Split the god file  `[M]`

**Why:** 1,131 lines, three generation paths, all prompt logic — unworkable for parallel work.

**Do:** Under `src/services/generation/`:
- `context.builder.ts` — assembles `StudentContextInput` + chapter thread (A5). Pure, testable.
- `passage.generator.ts` — single passage tool-use call.
- `question.generator.ts` — single question tool-use call (currently `generateQuestionsForPassage`).
- `review.generator.ts` — `generateReviewSession`.
- `persister.ts` — bank writes + session create (the repeated `prisma.session.create` blocks).
- `index.ts` — orchestrates the pipeline; this is what controllers call.

**Acceptance:** No file in `generation/` exceeds ~250 lines. Existing endpoints behave
identically (regression-test by generating one session before/after and diffing shape).

---

### A4. Validator stage  `[M]`  ← shared with Pillar C, but lives in the pipeline

**Why:** This is the highest-leverage quality lever. Today nothing verifies the passage
is correct or the questions are answerable.

**Do:** `src/services/generation/validator.ts`. After generation, one Haiku call scores
the passage+questions against a rubric (tool-use, returns structured scores 0–1):
- `conceptCoverage` — does the passage actually teach the target concepts?
- `answerability` — is each question answerable from the passage alone?
- `keyCorrectness` — is each marked-correct answer actually correct?
- `distractorQuality` — are distractors plausible misconceptions, not throwaways?
- `lengthOk` / `readabilityOk` — within 220–260 words, right grade level?

If aggregate < threshold (e.g. 0.7) → regenerate **once**, then accept best-of-2 and flag.
Store the score on the passage (see B-observability).

**Acceptance:** Every generated passage has a stored validation score. A deliberately bad
passage (e.g. concepts stripped from the prompt) scores low and triggers one regeneration.

**Files:** new `validator.ts`, `schema.prisma` (add validation fields to `PassageBank`).

---

### A5. Chapter thread context + coverage summary  `[M]`

**Why:** Passages are generated in isolation. On retry we tell the model "approach from a
different angle" but it doesn't know the previous angle. Across subtopics we send only the
subtopic *name* (`content.service.ts:649`), not what was actually taught.

**Do:** (Full spec in `GENERATION_IMPROVEMENTS_PLAN.md`.)
- Add `generationSummary String?` to `Session`.
- After generation, a cheap summary call writes ~100 tokens: examples used, concepts
  covered, approach angle, question angles, quiz result.
- `buildChapterThreadContext(studentId, chapterId)` fetches prior summaries and injects
  them — "don't reuse NaCl, student was weak on lattice-energy direction."

**Acceptance:** Generating subtopic 2 includes a `CHAPTER GENERATION HISTORY` block. A
retry includes the previous attempt's summary and uses a different example.

---

### A6. Stronger model for the passage (cheap experiment)  `[S]`

**Why:** The passage is the highest-leverage artifact and currently uses Haiku
(`content.service.ts:780`). Questions can stay Haiku.

**Do:** Make the passage model a per-prompt config value (falls out of A1). Try Sonnet for
the passage on a flagged cohort; compare validation scores (A4) and quiz outcomes.

**Acceptance:** Model is config-driven; we have a measured comparison before committing cost.

---

# PILLAR B — Knowledge Graph Depth (Owner: Backend coworker)

> This turns the graph from decoration into the adaptive engine. The valuable, slow part
> is authoring concept-prerequisite edges (B2) — start that data work early.

### B1. Promote concepts into Neo4j  `[M]`

**Why:** Concepts and per-concept mastery live only in Postgres. The graph can't reason
about them.

**Do:**
- Seed `(:Concept {tag, name, subtopicId})` nodes and
  `(:Concept)-[:PART_OF]->(:Subtopic)-[:PART_OF]->(:Topic)` from `data/subtopics.ts`
  (extend `neo4j.seed.ts`).
- In `subtopics.service.syncChapterMasteryToNeo4j` (line 212), also upsert a
  `(:Student)-[:KNOWS_CONCEPT {mastery, retention, trend}]->(:Concept)` edge per concept.

**Acceptance:** Neo4j has one `Concept` node per concept in `data/subtopics.ts`, linked to
its subtopic/topic, with per-student `KNOWS_CONCEPT` edges that update after a quiz.

**Files:** `neo4j.seed.ts`, `subtopics.service.ts:212`, `data/subtopics.ts` (source of truth).

---

### B2. Concept-level prerequisite edges  `[L]` ← the moat

**Why:** Real adaptivity needs concept-level prerequisites. When a student fails
`stoichiometry`, we want to trace that the actual gap is upstream `mole_concept`, not just
"the Basic Concepts topic."

**Do:**
- Add a `prerequisites: string[]` field to `ConceptDefinition` in `data/subtopics.ts`
  (list of upstream concept tags).
- **Author the edges.** Claude-assisted first pass over the NCERT concept list, then human
  review — this is the data-quality task that makes everything downstream good. Budget real
  time for it.
- Seed `(:Concept)-[:REQUIRES]->(:Concept)` from that field.

**Acceptance:** Every concept that logically depends on another has a `REQUIRES` edge.
A Cypher query "given failed concept X, return its unmastered prerequisite concepts" returns
sensible results.

---

### B3. Cross-topic concept links  `[M]`

**Why:** `lattice_energy` (bonding) relates to `enthalpy` (thermodynamics). These links
enable transfer-learning detection and much better recommendations.

**Do:** Add `(:Concept)-[:RELATED_TO]->(:Concept)` across topics (same authoring approach
as B2). Surface in the graph payload.

**Acceptance:** Cross-topic related concepts are queryable and appear in the graph API.

---

### B4. Readiness + smarter recommendations  `[M]`

**Why:** Current `getRecommendedTopics` (`neo4j.service.ts:229`) just sorts by
`attempts DESC, mastery DESC` at topic level — it ignores prerequisites entirely.

**Do:** Replace with a readiness query: recommend concepts/subtopics where **all REQUIRES
prerequisites are mastered** and the target itself is weak or unstarted. Prioritise
concepts that are prerequisites for the most downstream concepts (high-leverage unlocks).

**Acceptance:** Recommendations never suggest a concept whose prerequisites are unmastered;
high-leverage prerequisites rank first.

**Files:** `neo4j.service.ts:229`, graph controller.

---

### B5. Misconception taxonomy  `[M]` (feeds Pillar A's question prompt)

**Why:** Distractor quality *is* question quality (RESEARCH_FOUNDATIONS §6, Adesope 2017).
Today the prompt asks for "plausible distractors" with no source of real misconceptions.

**Do:**
- New table `Misconception { conceptTag, belief, why }`.
- Seed common JEE/NEET misconceptions per concept (Claude-assisted + human review).
- Inject the relevant misconceptions into the question prompt so distractors are real traps.

**Acceptance:** Question prompt receives concept-specific misconceptions; spot-check shows
distractors map to known student errors rather than generic wrong values.

---

### B6. Observability + eval harness  `[M]`

**Why:** We can't improve what we can't measure.

**Do:**
- `GenerationLog { sessionId, stage, model, promptVersion, inputTokens, outputTokens,
  latencyMs, source(bank|generated), validationScore, retries }`. Write one row per
  generation stage.
- **Golden set:** ~20 frozen `(studentState → generation)` cases. A script runs them and
  reports validation scores. Run before/after any prompt change (A1/A6).

**Acceptance:** A dashboard query shows per-day token spend, bank-hit rate, mean validation
score, p95 latency. The golden-set script prints a score table on demand.

---

# PILLAR C — Surface the Science (Owner: Frontend coworker)

> Most of this reads data the backend already produces. The concept-graph view (C1) waits
> on B1; everything else can start now.

### C1. Concept-level graph view  `[L]`  (depends on B1/B2)

**Why:** The D3 graph (`components/knowledge-graph-d3.tsx`) shows only topics. The real
structure is at the concept level.

**Do:** Render concept nodes within subtopic/topic clusters; draw `REQUIRES` edges; let the
user drill topic → subtopic → concept. Color nodes by **mastery** or, on toggle, by
**retention** (decaying-memory heatmap).

**Acceptance:** User can zoom into a topic and see its concepts, their mastery, and
prerequisite arrows; a toggle switches mastery↔retention coloring.

---

### C2. Per-concept forgetting curve  `[M]`

**Why:** Showing learners their own forgetting curve improves self-regulated learning. All
the data exists (`halfLifeDays`, `lastAttempted`, `computeNextReviewDate` already exported).

**Do:** Mini-chart per concept: sampled `R = e^(-t/h)` forward from now + the next-review
date. "Your memory of Lattice Energy is at 46% and decaying — review by Thursday."
(shadcn chart components are already vendored.)

**Acceptance:** Each concept shows a decay curve and a concrete review-by date matching the
backend's `nextReviewDate`.

---

### C3. Insight + velocity chips  `[S]`

**Why:** `velocity`, `scoreVariance`, `trend`, per-cognitive-level scores are all computed
and exposed but never shown.

**Do:** Small chips in the chapter/concept view: "improving fast on Bonding," "plateauing on
Thermodynamics," "weakest level: inference." A Bloom radar per subtopic from the five
cognitive scores.

**Acceptance:** Chips render from existing `/subtopics/:id/concepts` fields; no backend change.

---

### C4. Show question explanations + review mode UI  `[M]`

**Why:** `explanation` is returned per answer but never displayed
(`quiz.service.ts:229,318`). Review queue + session endpoints exist (`/api/review/...`) but
the frontend ignores them.

**Do:**
- Wire `explanation` into the quiz results screen.
- "Review" entry on the dashboard ("12 concepts due today") → review session reusing the
  quiz UI → completion screen showing concepts re-consolidated to longer intervals.

**Acceptance:** Explanations show after each question; a student can complete a cross-topic
review session end to end.

---

### C5. Engagement-signal capture  `[S]`  (feeds Pillar A/C quality loop)

**Why:** A real passage-quality metric needs more than question correctness. Time-on-passage
is the cheapest engagement proxy.

**Do:** Send `timeOnPassageMs` and scroll-depth when the student starts the quiz; backend
stores it on the session for the quality metric (coordinate one small field with Pillar A).

**Acceptance:** Passage dwell-time is recorded per session and available to the quality
metric.

---

## Recommended first sprint (highest impact across pillars)

1. **A1 + A2** — config prompts + tool output. Unblocks everyone, kills parsing bugs.
2. **A4** — LLM-judge validator. Immediate, measurable passage/question quality jump.
3. **B1 + B2 (start)** — concepts in Neo4j + begin authoring concept-prereq edges.
4. **C3 + C4** — fastest visible wins for the frontend while B1 lands.

B5 (misconceptions) and B6 (eval harness) are close behind — both compound everything else.

## Effort key
`[S]` ≈ <1 day · `[M]` ≈ 1–3 days · `[L]` ≈ multi-day / needs data authoring

## Related specs
- `GENERATION_IMPROVEMENTS_PLAN.md` — full detail for A2 (tool output) and A5 (thread context).
- `RESEARCH_FOUNDATIONS.md` — the science behind the memory model and question design.
- `FEATURE_ROADMAP.md` — original phased roadmap (Phases 0–4); this doc supersedes its
  architecture sections and folds the student-facing phases into Pillar C.
