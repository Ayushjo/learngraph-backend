# Learngraph — Feature Roadmap (Cognitive-Science-Driven)

## Context

Learngraph is an adaptive learning engine for NCERT Chemistry (Class 11/12, JEE/NEET) built on real memory science: an Ebbinghaus forgetting curve (`R = e^(-t/halfLife)`), SM-2-style streak→half-life progression, learning velocity, IRT question calibration, Bloom's-taxonomy per-level scoring, and a Neo4j prerequisite graph.

Exploration of the current codebase surfaced one structural truth that shapes this whole roadmap: **the system measures memory decay but never acts on it.** `concept.service.getDueForReview()` exists and is even exposed at `GET /api/subtopics/:studentId/review-due`, but the frontend never calls it and no flow ever brings a student back to a decaying concept. Learning is purely forward/linear (subtopic → subtopic). The "repetition" half of spaced repetition is missing. Several other computed signals are invisible: `scoreVariance` (computed, stored, never exposed), the Neo4j `trend` property (never populated), `/graph/:studentId/recommendations` (endpoint exists, frontend ignores it), per-concept cognitive-level scores (exposed, never visualized), and question `explanation` text (stored, never shown to students).

This roadmap is a **phased plan**: each phase is independently shippable and ordered by payoff-to-effort. Phase 1 closes the spaced-repetition loop, Phase 2 deepens the memory model, Phase 3 makes the science visible to learners, Phase 4 adds science-grounded motivation. Phase 0 is quick wins using data already computed.

> Note: This is a strategic roadmap, not a single change. File/function references point to existing code to **reuse**. Detailed per-feature implementation specs should be written when each phase is picked up.

---

## Cross-cutting enabler (needed by Phases 3 & 4): mastery history

Today `ConceptMastery` holds only the *current* snapshot. There is no time series, so true velocity charts, trend lines, and time-to-mastery cannot be drawn from real history (they'd be faked from `QuizAttempt`).

**Add a lightweight append-only snapshot** written inside `conceptService.updateConceptMastery` (`concept.service.ts:124`):

```
model ConceptMasteryEvent {
  id          String   @id @default(cuid())
  studentId   String
  conceptId   String
  mastery     Float
  effective   Float
  retention   Float
  halfLifeDays Float
  velocity    Float
  isCorrect   Boolean
  createdAt   DateTime @default(now())
  @@index([studentId, conceptId, createdAt])
}
```

This single table unlocks: real velocity (slope over time), trend classification, forgetting-curve replays, and consolidation analytics. Build it at the start of Phase 3 (or earlier if convenient).

---

## Phase 0 — Quick Wins (surface what's already computed)

Goal: zero new algorithms; expose and display data the backend already produces. High trust-building payoff.

1. **Populate the Neo4j `trend` (currently always null).** `subtopics.service.updateSubtopicMastery` already computes a subtopic `trend` (`subtopics.service.ts:158-163`). Carry an aggregate trend into `syncChapterMasteryToNeo4j` (`subtopics.service.ts:211`) and `SET k.trend = $trend` on the `KNOWS` edge. The graph view + `masteryService.getTopicMastery` already read this field — it just arrives empty today.

2. **Show question explanations in results.** `submitAnswer`/`submitQuiz` already return `explanation` per answer (`quiz.service.ts:229`, `:318`). Frontend results screen shows correct/incorrect but not the stored explanation — wire it into the quiz results UI (`frontend/app/chapter/[id]/subtopic/[subtopicId]/quiz`).

3. **Wire up "Study Next".** `neo4jService.getRecommendedTopics` is exposed at `GET /api/graph/:studentId/recommendations` and never called. Add a "Recommended for you" panel on `/dashboard` or `/progress`.

4. **Expose `scoreVariance` + per-concept signals.** The `/subtopics/:subtopicId/concepts` endpoint already returns most concept fields; confirm `scoreVariance`, `velocity`, `retentionScore`, `halfLifeDays`, `daysUntilReview` are included, and add a small per-concept "insight" chip in the chapter view.

---

## Phase 1 — Spaced Repetition / Review Mode (the core theoretical win)

Goal: turn the measured forgetting curve into action. A cross-topic daily Review Queue that brings students back to decaying concepts at the right moment — this is what Ebbinghaus → SM-2 → Duolingo HLR all exist to enable.

### Theory
With `R = e^(-t/h)`, the time for retention to fall to a target `r` is `t = -h·ln(r)`. Pashler et al. (2007) found reviewing at ~90% retention is near-optimal, i.e. `t ≈ 0.105·h`; the 50%-retention point is `t ≈ 0.69·h`. A concept's **next review date** is therefore directly computable from `lastAttempted` and `halfLifeDays` — no new state needed. A successful review then advances `consecutiveCorrect`, which bumps `halfLifeDays` up the `HALF_LIFE_PROGRESSION` ladder (`concept.service.ts:54`) — exactly the SM-2 expanding-interval mechanic.

### Backend
- **Add `computeNextReviewDate(lastAttempted, halfLifeDays, targetRetention=0.85)`** as an exported helper in `concept.service.ts` (mirrors the existing private `computeRetention`).
- **Upgrade `getDueForReview`** (`concept.service.ts:230`): keep the current `effective < mastery·0.7` heuristic but add a true due-date sort and an `overdueDays` / `urgency` field so the queue can be prioritized (most-decayed, prerequisite-critical first).
- **New endpoint** `GET /api/review/:studentId/queue` → prioritized due concepts across **all** subtopics (the cross-cutting part — current learning is single-subtopic only).
- **New `contentService.generateReviewSession(studentId, conceptIds[])`**: a mixed-concept passage + question set. Reuse `buildQuestionAllocation` (`content.service.ts:107`), `buildForgettingContext` (`content.service.ts:246`), `getTargetDifficulty` (`content.service.ts:94`), `getWeakestCogLevel`, and the existing Claude generation path. The only new logic is assembling a slot list from concepts spanning multiple subtopics rather than one.
- **Answer handling reuses the existing path** — `quiz.service.submitAnswer` → `conceptService.updateConceptMastery` already advances half-life on success and resets it on failure. No change needed; review answers automatically push concepts up/down the interval ladder.
- **Scheduled precompute (optional):** extend the `jobs/quality.job.ts` interval-job pattern (`startQualityJob`, wired at `index.ts:45`) to precompute each active student's due-count nightly so the dashboard badge is instant.

### Frontend
- A **"Review" entry point** on `/dashboard`: "12 concepts due today" card.
- A **Review session screen** reusing the existing quiz UI; on completion show how many concepts were "re-consolidated" (moved to a longer interval).

### Risk/effort
Medium. The generation and grading machinery already exists; the new work is the cross-topic queue, the review-session assembly, and one new screen.

---

## Phase 2 — Deeper Memory Model (principled, not a fixed ladder)

Goal: replace the discrete `HALF_LIFE_PROGRESSION = [1,3,7,14,30,60]` ladder with a continuous, individualized model, moving from "Ebbinghaus + SM-2" toward the modern FSRS / HLR two-component view.

### Options (recommend FSRS-lite)
- **FSRS-lite (recommended):** track two components per concept — **stability `S`** (≈ current `halfLifeDays`) and **difficulty `D`** (per-concept, distinct from question difficulty). On a successful review, grow `S` *more* when retention was *lower* at review time (the spacing effect / desirable difficulty); grow it less for easy/early reviews. This is what modern Anki uses and directly generalizes the current ladder. Replace the ladder lookup in `computeUpdatedHalfLife` (`concept.service.ts:54`) with a stability-update function.
- **SM-2 continuous (lighter):** add an `easeFactor` field (start 2.5), `interval = prevInterval · easeFactor`, ease nudged by an answer grade derived from correctness + question difficulty. Closer to the cited 1990 algorithm, smaller change.
- **Difficulty-weighted growth:** we already pass question `difficulty` into `updateConceptMastery` — let hard concepts grow `halfLifeDays` more slowly.
- **Smoothed velocity:** today `velocity = currentScore - prevLastScore` is a single-step delta (`concept.service.ts:88`). Compute it as an EMA of recent deltas (or slope over last K events from `ConceptMasteryEvent`) for a stable "improving/plateauing/declining" signal.
- **Sleep-consolidation boost (Murre & Dros 2015):** if a review lands ~18–30h after the prior attempt, grant a small stability bonus.

### Data model
Add `stability Float`, `difficulty Float` (or `easeFactor Float`) to `ConceptMastery` with safe defaults so existing rows migrate cleanly. Keep `halfLifeDays`/`retentionScore` as derived/compat fields during transition.

### Risk/effort
Medium-high (touches the core update path + a migration). De-risk by keeping the old ladder behind a flag and A/B-comparing recall prediction against the new model using `ConceptMasteryEvent` data.

---

## Phase 3 — Surface the Science to Students (metacognition)

Goal: make the invisible model visible. Showing learners their own forgetting curve improves self-regulated learning. Depends on the `ConceptMasteryEvent` enabler.

### Backend
- **Forgetting-curve projection endpoint:** for a concept, return sampled `R = e^(-t/h)` from now forward plus `nextReviewDate` (reuse the Phase 1 helper). No new storage.
- **Velocity / trend / time-to-mastery** computed from `ConceptMasteryEvent` history.
- **Memory-strength feed for the graph:** extend the graph payload so nodes can be colored by **retention** (decaying) in addition to **mastery** (learned).

### Frontend
- **Per-concept forgetting curve** mini-chart: "Your memory of *Lattice Energy* is at 46% and decaying — review by Thursday." (shadcn `chart` components already vendored.)
- **Velocity/trend chips:** "improving fast on Bonding, plateauing on Thermodynamics."
- **Memory-strength heatmap toggle** on the existing D3 graph (`components/knowledge-graph-d3.tsx`) — color by retention vs mastery.
- **Cognitive-level radar** per subtopic from the five Bloom scores already in `ConceptMastery` (`recallScore`…`applicationScore`).
- **Weak-spots + Study-next panel** from `getWeakestConcepts` (`concept.service.ts:221`) and the recommendations endpoint.

### Risk/effort
Low-medium backend, medium frontend (charts). Mostly presentation over existing data once the event table exists.

---

## Phase 4 — Science-Grounded Gamification

Goal: motivation aligned with the cognitive science, not vanity metrics. Showing up daily to clear the review queue *is* optimal spacing — so reward exactly that.

### Features
- **Daily Review Streak:** consecutive days the student cleared (or substantially cleared) their due queue. New `StudentStreak` model (`currentStreak`, `longestStreak`, `lastReviewDate`), updated when a Phase 1 review session completes.
- **"Memory Strength" as the XP metaphor:** aggregate of half-life rungs reached across concepts; a concept at the 60-day rung is "locked into long-term memory." Reuses `halfLifeDays`/`stability` directly — no separate point economy.
- **Consolidation milestones:** "You've locked in 25 concepts to long-term memory," "7-day review streak."
- **Per-concept streak flame** from the existing `consecutiveCorrect` field.

### Risk/effort
Low-medium. One small model + reads over data Phases 1–2 already produce.

---

## Recommended sequencing

1. **Phase 0** quick wins (days) — trust + immediate visible value.
2. **Phase 1** Review Mode (the headline feature; makes the existing science *do* something).
3. **`ConceptMasteryEvent`** enabler (small, unblocks 3 & 4).
4. **Phase 3** surface-the-science (high perceived value, low algorithmic risk).
5. **Phase 2** deeper memory model (highest rigor; validate against history collected in 1+3).
6. **Phase 4** gamification (compounds on everything above).

---

## Verification (per phase)

General loop to validate any phase locally:
1. Start Postgres + Neo4j, run `prisma migrate` for any schema additions, run the seed (`src/seed/*`).
2. Start the backend (`index.ts`, port 3700) and the Next.js frontend.
3. Create a student (`POST /api/students`), generate a session, and answer questions to build real `ConceptMastery` rows.
4. **Simulate decay** by back-dating `lastAttempted` on `ConceptMastery` rows (e.g. set 10–40 days ago), then:
   - Phase 0: confirm `KNOWS.trend` is now non-null in Neo4j; confirm explanations render; confirm recommendations panel populates.
   - Phase 1: hit `GET /api/review/:studentId/queue` — decayed concepts appear, prioritized; run a review session and confirm `consecutiveCorrect`/`halfLifeDays` advance on success.
   - Phase 2: with the same back-dated data, compare new-model predicted recall vs actual outcomes using `ConceptMasteryEvent`.
   - Phase 3: confirm the forgetting-curve chart and trend/velocity match the event history.
   - Phase 4: complete a review session on consecutive (simulated) days and confirm streak increments.
5. Run existing tests / typecheck (`tsc`) and the `code-review` skill on each phase's diff.

## Out of scope (deliberately deferred)
- Bayesian Knowledge Tracing (probabilistic mastery replacing the EMA) and per-student IRT ability (`θ`) estimation — noted as a future "ambitious" track; revisit after Phase 2 data exists.
- Multi-subject expansion (Physics/Bio/Math), teacher/parent dashboards, offline mode.
