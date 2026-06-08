# Learngraph Backend — Complete Technical Documentation

**Stack:** Node.js · TypeScript · Express · PostgreSQL (Prisma ORM) · Neo4j · Anthropic Claude API  
**Purpose:** Adaptive learning engine for NCERT Chemistry (Class 11 & 12), targeting JEE/NEET students

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Design](#2-database-design)
3. [Core Algorithms](#3-core-algorithms)
   - 3.1 [Forgetting Curve & Retention](#31-forgetting-curve--retention)
   - 3.2 [Learning Velocity](#32-learning-velocity)
   - 3.3 [Streak & Half-Life Progression](#33-streak--half-life-progression)
   - 3.4 [Effective Mastery Formula](#34-effective-mastery-formula)
   - 3.5 [Cognitive Level Scoring](#35-cognitive-level-scoring)
   - 3.6 [Item Response Theory (IRT)](#36-item-response-theory-irt)
4. [Service Layer](#4-service-layer)
   - 4.1 [concept.service.ts](#41-conceptservicets)
   - 4.2 [content.service.ts](#42-contentservicets)
   - 4.3 [quiz.service.ts](#43-quizservicets)
   - 4.4 [subtopics.service.ts](#44-subtopicsservicets)
   - 4.5 [question.bank.service.ts](#45-questionbankservicets)
   - 4.6 [passage.bank.service.ts](#46-passagebankservicets)
   - 4.7 [mastery.service.ts](#47-masteryservicets)
   - 4.8 [preemptive.service.ts](#48-preemptiveservicets)
5. [Content Generation Pipeline](#5-content-generation-pipeline)
6. [Session & Quiz Flow](#6-session--quiz-flow)
7. [Knowledge Graph (Neo4j)](#7-knowledge-graph-neo4j)
8. [API Routes](#8-api-routes)
9. [Data Flow: Answer to Mastery Update](#9-data-flow-answer-to-mastery-update)
10. [Benefits & Design Rationale](#10-benefits--design-rationale)
11. [What Is Implemented vs. What Is Planned](#11-what-is-implemented-vs-what-is-planned)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Express API                          │
│  /students  /graph  /quiz  /content  /subtopics           │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────────┐  ┌──────────────┐
  │PostgreSQL│    │    Neo4j     │  │ Claude API   │
  │(Prisma)  │    │ Knowledge    │  │ (Haiku 4.5)  │
  │          │    │ Graph        │  │              │
  │Students  │    │              │  │ Passage +    │
  │Concepts  │    │ Topics       │  │ Question     │
  │Mastery   │    │ Prerequisites│  │ Generation   │
  │Sessions  │    │ Student→Topic│  │              │
  │Questions │    │ KNOWS edges  │  └──────────────┘
  │Passages  │    └──────────────┘
  └──────────┘
```

**PostgreSQL** stores all per-student learning state: mastery scores, retention, velocity, streaks, sessions, question/passage banks.

**Neo4j** stores the curriculum graph: which chapters require which prerequisite chapters, and each student's topic-level mastery as relationship properties on `KNOWS` edges.

**Claude Haiku 4.5** generates personalized reading passages (220–260 words) and 8 quiz questions per session, informed by the student's current concept state.

---

## 2. Database Design

### 2.1 Core Models (PostgreSQL via Prisma)

#### `ConceptMastery` — the central learning state record

```
ConceptMastery {
  studentId          — FK to Student
  conceptId          — FK to Concept

  // Raw performance
  mastery            Float   — exponential moving average of correct/wrong (0–1)
  lastScore          Float   — 0.0 or 1.0 from the most recent answer
  previousScore      Float   — lastScore before this update
  attempts           Int     — total number of answers on this concept
  lastAttempted      DateTime

  // Velocity
  velocity           Float   — currentScore - previousScore (−1.0 to +1.0)
  scoreVariance      Float   — EMA of score deviation (stability indicator)

  // Forgetting curve
  retentionScore     Float   — e^(-days / halfLifeDays), computed on last attempt
  halfLifeDays       Float   — memory stability in days (1 → 3 → 7 → 14 → 30 → 60)

  // Streak
  consecutiveCorrect Int     — resets to 0 on wrong; drives halfLifeDays progression
  consecutiveWrong   Int     — resets to 0 on correct

  // Bloom's Taxonomy per-level scores
  recallScore        Float
  vocabularyScore    Float
  causeEffectScore   Float
  inferenceScore     Float
  applicationScore   Float
}
```

#### `SubtopicMastery`

Aggregated from all concept masteries under a subtopic. Tracks the overall mastery, attempt count, completion status, and trend (improving / declining / stable). Used for chapter progress display and content generation context.

#### `Session`

One session = one reading passage + one question pool (8 questions: 5 primary + 3 backup). Stores `shownQuestions`, `pendingRetries`, and `totalCorrect` to manage the adaptive question delivery within a session (up to 10 questions shown total).

#### `QuestionBank`

Persistent store of all AI-generated questions. Tracks `difficulty`, `timesAnswered`, `timesCorrect`, and `discriminationIndex` for IRT-based quality calibration. Questions with high discrimination are preferred in assembly.

#### `PassageBank`

Persistent store of all AI-generated passages. Tracks `averageScore` for quality filtering. Prevents students from seeing the same passage twice via `StudentSeenContent`.

#### `StudentSeenContent`

Deduplication table. Tracks which passages and questions each student has already seen, preventing repetition.

---

## 3. Core Algorithms

### 3.1 Forgetting Curve & Retention

**File:** `src/services/concept.service.ts`

The system implements the **exponential decay model** established by Ebbinghaus (1885) and simplified by Settles & Meeder (2016):

```
retention = e^(-t / halfLifeDays)
```

```typescript
const computeRetention = (lastAttempted: Date | null, halfLifeDays: number): number => {
  const days = daysSince(lastAttempted);
  if (days === 0) return 1.0;
  return Math.exp(-days / halfLifeDays);
};
```

**What this means in practice:**
- Immediately after answering: retention = 1.0 (100%)
- After `halfLifeDays` days: retention ≈ 0.37 (37%)
- After `2 × halfLifeDays` days: retention ≈ 0.14 (14%)
- After `3 × halfLifeDays` days: retention ≈ 0.05 (5%)

`retentionScore` is stored to the database on every concept mastery update so the frontend can display it without recalculating.

**Forgetting Alert:** When `daysSinceAttempt > halfLifeDays`, the content generation system injects a `FORGETTING ALERT` block into the Claude prompt, instructing the AI to reinforce these concepts in the generated passage even if their `effectiveMastery` looks acceptable on paper.

---

### 3.2 Learning Velocity

**File:** `src/services/concept.service.ts`

```typescript
const currentScore = isCorrect ? 1.0 : 0.0;
const velocity = currentScore - prevLastScore;
```

Velocity captures the **direction and magnitude of the most recent learning event**:

| Scenario | Velocity |
|---|---|
| Correct after correct | 0.0 (stable) |
| Correct after wrong | +1.0 (improving) |
| Wrong after correct | −1.0 (declining) |
| Wrong after wrong | 0.0 (stable/struggling) |

Velocity is used in `getEffectiveMastery()` as a short-term momentum correction — it responds faster to sudden performance changes than the slow exponential decay alone. A student who has been getting things right for weeks but just got one wrong will see their effective mastery drop earlier than the decay curve would cause.

**`scoreVariance`** is a complementary metric:
```typescript
variance = existingVariance * 0.7 + |currentScore - newMastery| * 0.3
```
High variance indicates inconsistent performance (some topics are being guessed). Low variance near 0 indicates either solid mastery or consistent failure.

---

### 3.3 Streak & Half-Life Progression

**File:** `src/services/concept.service.ts`

```typescript
const HALF_LIFE_PROGRESSION = [1, 3, 7, 14, 30, 60]; // days

computeUpdatedHalfLife(consecutiveCorrect, consecutiveWrong, isCorrect) {
  if (isCorrect) {
    const newStreak = consecutiveCorrect + 1;
    const idx = Math.min(newStreak - 1, HALF_LIFE_PROGRESSION.length - 1);
    return {
      halfLifeDays: HALF_LIFE_PROGRESSION[idx],  // 1 → 3 → 7 → 14 → 30 → 60
      consecutiveCorrect: newStreak,
      consecutiveWrong: 0,
    };
  }
  return {
    halfLifeDays: 1.0,   // Reset on any wrong answer
    consecutiveCorrect: 0,
    consecutiveWrong: consecutiveWrong + 1,
  };
}
```

**Half-life milestone table:**

| Consecutive Correct | Half-Life | Meaning |
|---|---|---|
| 1 | 1 day | Just learned — review tomorrow |
| 2 | 3 days | Starting to stick |
| 3 | 7 days | One week interval |
| 4 | 14 days | Two weeks |
| 5 | 30 days | Monthly review |
| 6+ | 60 days | Well consolidated |
| Any wrong | 1 day | Back to beginning |

**Why this design:** This is a simplified version of the SM-2 algorithm (Wozniak, 1990). SM-2 uses a continuous ease factor multiplied per review; Learngraph uses 6 discrete milestones. The simplification trades granularity for predictability and ease of reasoning — appropriate before the system has enough data to train a regression model (as in Duolingo's HLR).

---

### 3.4 Effective Mastery Formula

**File:** `src/services/concept.service.ts`

`effectiveMastery` is the single number that drives all downstream decisions: question difficulty selection, passage generation instructions, subtopic completion, and review due detection.

```typescript
getEffectiveMastery(cm: ConceptMastery): number {
  const retention = computeRetention(cm.lastAttempted, cm.halfLifeDays);
  const velocityFactor = Math.min(1.3, Math.max(0.7, 1 + cm.velocity * 0.2));
  return Math.min(1, cm.mastery * retention * velocityFactor);
}
```

```
effectiveMastery = min(1, mastery × retention × velocityFactor)
```

**Component breakdown:**

| Component | Formula | Effect |
|---|---|---|
| `mastery` | EMA of past scores | Baseline stored learning |
| `retention` | `e^(-t/halfLife)` | Decay from time passed |
| `velocityFactor` | `clamp(1 + v×0.2, 0.7, 1.3)` | Momentum adjustment |

**Mastery level labels (used in content generation):**

| effectiveMastery | Label | Passage instruction |
|---|---|---|
| < 0.30 | CRITICAL GAP | Explain from scratch, recall/vocabulary questions only |
| 0.30 – 0.50 | WEAK | Reinforce core idea with cause-and-effect |
| 0.50 – 0.75 | DEVELOPING | Push toward deeper understanding |
| ≥ 0.75 | STRONG | Challenge with application/inference |

**Raw mastery update (Exponential Moving Average with adaptive learning rate):**
```typescript
const alpha = attempts === 1 ? 0.6 : attempts === 2 ? 0.4 : 0.3;
newMastery = previousMastery + alpha × scoreWeight × (currentScore - previousMastery)
```
Where `scoreWeight = difficulty` if correct, `1 - difficulty` if wrong — so a correct answer on a hard question moves mastery more than a correct answer on an easy one.

**Review due detection:**
```typescript
getDueForReview: cm => effectiveMastery < cm.mastery * 0.7
```
A concept is flagged for review when retention decay has reduced its effective mastery more than 30% below its stored peak mastery.

---

### 3.5 Cognitive Level Scoring

**File:** `src/services/concept.service.ts`

Learngraph tracks mastery at five Bloom's Taxonomy levels independently per concept:

```
recall → vocabulary → cause_and_effect → inference → application
```

Each level has its own score (0–1), updated via a separate EMA:
```typescript
newCogScore = prevCogScore + 0.4 × (currentScore - prevCogScore)
```

The weakest cognitive level for each concept is computed and passed to the passage generation system, which must target questions at that level. This prevents students from being trapped in recall-only practice when their underlying problem is inability to apply the concept.

---

### 3.6 Item Response Theory (IRT)

**File:** `src/services/question.bank.service.ts`

**Difficulty estimation** (empirical, updated after 5+ attempts):
```typescript
difficulty = 1 - correctRate   // where correctRate = timesCorrect / timesAnswered
```

**Discrimination index** (updated after 20+ attempts):
```typescript
discriminationIndex = √(correctRate × (1 - correctRate))
```

Maximum discrimination occurs at `correctRate = 0.5` (the question best separates students who know from those who don't). Questions are assembled in order of `discriminationIndex DESC` — the best differentiators are served first.

**Target difficulty mapping from effectiveMastery:**
```typescript
// In content.service.ts
function getTargetDifficulty(effectiveMastery: number): number {
  if (m < 0.3)  return 0.20 + m × 0.50;          // 0.20–0.35 (easy)
  if (m < 0.6)  return 0.35 + (m−0.3) × 1.00;    // 0.35–0.65 (medium)
  if (m < 0.8)  return 0.65 + (m−0.6) × 0.75;    // 0.65–0.80 (hard)
  return         0.80 + (m−0.8) × 0.50;           // 0.80–0.90 (very hard)
}
```

---

## 4. Service Layer

### 4.1 `concept.service.ts`

**Purpose:** All per-concept learning state: mastery, retention, velocity, streak.

| Export | What it does |
|---|---|
| `getEffectiveMastery(cm)` | Computes `mastery × retention × velocityFactor` on demand |
| `computeUpdatedHalfLife(...)` | Advances or resets half-life based on answer correctness |
| `updateConceptMastery(studentId, conceptId, isCorrect, cogLevel, difficulty)` | Full upsert: updates all mastery fields atomically after one answer |
| `getConceptsForSubtopic(studentId, subtopicId)` | Returns all `ConceptState[]` sorted by effectiveMastery ascending (weakest first) |
| `getWeakestConcepts(studentId, subtopicId, limit)` | Filters to `effectiveMastery < 0.6`, returns weakest N |
| `getDueForReview(studentId)` | Returns all concepts where `effectiveMastery < mastery × 0.7` |

**`ConceptState` interface** (the DTO passed everywhere):
```typescript
{
  conceptId, conceptName, tag,
  effectiveMastery,     // the key metric
  mastery,              // raw stored score
  velocity,
  consecutiveWrong,
  halfLifeDays,
  retentionScore,
  recallScore, vocabularyScore, causeEffectScore, inferenceScore, applicationScore,
  daysSinceAttempt,
  attempts
}
```

---

### 4.2 `content.service.ts`

**Purpose:** Generates the reading passage and question pool for a session. Integrates all concept state data into the Claude prompt.

**Main function:** `generatePassageAndQuestions(studentId, subtopicId, studentContext, onPassageReady?)`

**Generation pipeline:**

```
1. Check passage bank (avoid regenerating for first attempts)
   ├─ Passage found + bank questions available
   │    └─ Assemble question pool from bank → create session
   ├─ Passage found + no bank questions
   │    └─ Generate questions via Claude for this passage → store → create session
   └─ No passage (or retry attempt)
        └─ Generate full passage + questions via Claude → store both → create session
```

**Prompt construction blocks injected into every generation:**
- `buildConceptContext(concepts)` — mastery state table with labels (CRITICAL GAP / WEAK / DEVELOPING / STRONG), velocity labels, forgetting status
- `buildForgettingContext(concepts)` — `FORGETTING ALERT` block listing concepts past their half-life
- `buildMasteryLabelInstructions(concepts)` — mandatory per-label instructions for passage and question framing
- `buildAllocationTable(slots)` — exact question assignment: Q1–Q5 primary + Q6–Q8 backup with concept tag, cognitive level, and target difficulty for each

**Grade profiles:** Class 11 and 12 have distinct vocabulary, analogy domain, sentence style, and exam context profiles baked into the system prompt.

**Question allocation algorithm (`buildQuestionAllocation`):** 5 primary questions distributed across the weakest concepts. For 1 concept, all 5 questions target it. For 5 concepts, each gets one question. 3 backup questions always target the two weakest concepts at harder cognitive levels.

**Retry handling:** If `previousAttempts > 0`, a mandatory retry header is added requiring the AI to:
- Approach the same subtopic from a different angle
- Directly address misconceptions from the last wrong answers
- Increase or maintain difficulty based on last score percentage

---

### 4.3 `quiz.service.ts`

**Purpose:** Manages the in-session question delivery and post-session aggregation.

**Two submission modes:**

1. **`submitAnswer`** — one-question-at-a-time adaptive mode
   - Validates session state, marks question as shown
   - Updates concept mastery immediately on each answer
   - On wrong answer: finds a backup question on the same concept, adds to `pendingRetries`
   - Resolves the next question (pending retries take priority over primary questions)
   - Closes session after max 10 questions shown or all primary + retries exhausted

2. **`submitQuiz`** — bulk 5-answer submission mode (legacy batch mode)
   - Processes all 5 answers, updates all concept masteries in parallel
   - Updates subtopic mastery, passage quality, triggers preemptive generation

**On session completion (both modes):**
1. Creates `QuizAttempt` record
2. Calls `subtopicService.updateSubtopicMastery()` to re-aggregate from all concept effective masteries
3. Updates passage quality score in `PassageBank`
4. If subtopic just completed: fires `triggerPreemptiveGeneration()` asynchronously

**Grade thresholds:**
```
≥ 80%  → "Excellent"
≥ 60%  → "Good"
≥ 40%  → "Needs Practice"
< 40%  → "Keep Trying"
```

---

### 4.4 `subtopics.service.ts`

**Purpose:** Aggregates concept-level data to subtopic and chapter level. Manages the Neo4j KNOWS relationship and prerequisite context.

**`updateSubtopicMastery`:**
```typescript
// Subtopic mastery = average of all concept effectiveMasteries
newMastery = mean(concepts.map(c => c.effectiveMastery))

// Completion requires BOTH:
// 1. Average ≥ 0.60
// 2. Every single concept has effectiveMastery ≥ 0.30 (no critical gaps)
isComplete = newMastery >= 0.6 && allConceptsAboveFloor
```

**`getStudentContextForSubtopic`:** Builds the full `StudentContextInput` for content generation:
- Previous attempts and mastery from `SubtopicMastery`
- Weak cognitive levels: computed from last 3 sessions' answer history (any level with < 50% correct rate)
- Wrong questions with chosen/correct/explanation from last session
- Completed subtopics in the same chapter (so Claude doesn't re-explain them)
- Prerequisite mastery: 1-hop and 2-hop prerequisites from Neo4j `REQUIRES` edges
- Prerequisite gaps: any prerequisite with mastery < 0.5
- Concept states from `conceptService.getConceptsForSubtopic()`

**`syncChapterMasteryToNeo4j`:** After each subtopic update, recomputes chapter mastery as `sum(subtopicMastery) / totalSubtopics` and writes it to Neo4j as `k.mastery` on the `Student-[:KNOWS]->Topic` edge.

**Subtopic unlock logic:** Sequential — subtopic N is unlocked only when subtopic N-1 is marked `isComplete`. First subtopic is always unlocked.

---

### 4.5 `question.bank.service.ts`

**Purpose:** Manages the question bank — assembly, IRT update, deduplication.

**`assembleQuestionPool(studentId, subtopicId, slots)`:**
For each slot in the allocation, queries the bank with a 3-level fallback:
1. Match `conceptTag + cognitiveLevel + difficulty ±0.20`
2. Match `conceptTag + difficulty ±0.20` (any cognitive level)
3. Match `conceptTag + difficulty ±0.40` (wider window)
If any slot returns null on all three tries, returns `null` → triggers fresh generation.

Questions already seen by this student are excluded via `StudentSeenContent`.

**`updateQuestionIRT(questionId, isCorrect)`:**
- Updates `timesAnswered` and `timesCorrect`
- Recomputes `difficulty` if `timesAnswered ≥ 5`
- Recomputes `discriminationIndex` if `timesAnswered ≥ 20`
This is called asynchronously (fire-and-forget) on every answer submission to avoid adding latency.

---

### 4.6 `passage.bank.service.ts`

**Purpose:** Stores and retrieves passages; tracks quality and seen status.

**`findMatchingPassage`:** Returns an unseen, active passage for the given subtopic. Checks `StudentSeenContent` to exclude already-seen passages.

**`updatePassageQuality`:** After a session completes, recomputes `averageScore = mean(all quiz attempt scores for this passage)`. Passages with consistently low scores can be deactivated.

**`storePassage` and `storeQuestionsForPassage`:** Persists newly generated content to the bank so it can be reused by other students or by the same student on future visits.

---

### 4.7 `mastery.service.ts`

**Purpose:** Topic-level mastery read from Neo4j for the graph view.

**`getTopicMastery(studentId, topicId)`:** Returns the `KNOWS` relationship properties (`mastery`, `attempts`, `trend`, `lastAttempted`) and maps to a human-readable `masteryLevel` string (not_started / struggling / developing / proficient / mastered).

---

### 4.8 `preemptive.service.ts`

**Purpose:** Pre-generates the next subtopic's content when a student completes the current one, so there is no waiting when they proceed.

**`triggerPreemptiveGeneration(studentId, completedSubtopicId)`:**
1. Finds the next subtopic in order
2. Checks if an active session already exists for it (skip if so)
3. Builds the student context
4. Calls `contentService.generatePassageAndQuestions()`
5. Returns silently — errors are logged but never propagated to the caller

This is always called fire-and-forget (`triggerPreemptiveGeneration(...).catch(...)`) to avoid blocking the quiz submission response.

---

## 5. Content Generation Pipeline

```
generatePassageAndQuestions()
│
├── getStudentContextForSubtopic()
│     ├─ SubtopicMastery (previous attempts, mastery)
│     ├─ Last 3 sessions + quiz answers (weak cognitive levels, wrong questions)
│     ├─ Completed subtopics in chapter
│     ├─ conceptService.getConceptsForSubtopic() → ConceptState[]
│     └─ Neo4j: 1-hop + 2-hop prerequisites with mastery
│
├── buildQuestionAllocation(conceptStates)
│     └─ Maps weakest concepts to Q1–Q5 slots + Q6–Q8 backups
│         with cognitiveLevel = weakestCogLevel(concept)
│         and targetDifficulty = f(effectiveMastery)
│
├── [First attempt] Check PassageBank
│     ├─ Found + bank questions available → assemble pool → done
│     ├─ Found + no bank questions → generate questions via Claude → done
│     └─ Not found → fall through to generation
│
├── Build Claude system prompt
│     └─ Grade profile (Class 11 / 12)
│         + Retry instructions (if attempts > 0)
│         + Concept mastery state block
│         + Forgetting alert block
│         + Mastery label instructions
│
├── Call Claude Haiku 4.5 (passage, max_tokens: 800)
│     └─ Returns JSON: { title, passage }
│
├── Call Claude Haiku 4.5 (questions, max_tokens: 2000)
│     └─ Returns JSON: { questions: [...8 items] }
│
├── Store passage + questions to PassageBank + QuestionBank
│
└── Create Session record → return to frontend
```

**Prompt caching:** Both the system prompt and user prompt use `cache_control: { type: "ephemeral" }` on the Anthropic API, reducing latency and cost on repeated similar requests.

---

## 6. Session & Quiz Flow

```
Student requests new session
        │
        ▼
 generatePassageAndQuestions()
        │
        ▼
 Session created with:
   questions[]     = first 5 from pool (shown to student)
   questionPool[]  = all 8 (5 primary + 3 backup)
   shownQuestions  = []
   pendingRetries  = []
        │
        ▼
 Per-answer: submitAnswer()
        │
        ├─ isCorrect? → update ConceptMastery
        │
        ├─ Wrong answer?
        │    └─ Find backup question on same concept
        │         └─ Push backup index → pendingRetries
        │
        ├─ Resolve next question:
        │    1. pendingRetries[0] first (backlog of missed concepts)
        │    2. Next primary question (index 0–4 not yet shown)
        │    3. null if totalShown ≥ 10 or nothing left
        │
        └─ sessionComplete?
               └─ Create QuizAttempt
                  Update SubtopicMastery
                  Update PassageQuality
                  Trigger preemptive generation (if justCompleted)
```

---

## 7. Knowledge Graph (Neo4j)

**Schema:**
```
(Student)-[:KNOWS {mastery, attempts, trend, lastAttempted}]->(Topic)
(Topic)-[:REQUIRES]->(Topic)   // prerequisite dependency
```

**Reads (on every session start):**
```cypher
MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(p1:Topic)
OPTIONAL MATCH (p1)-[:REQUIRES]->(p2:Topic)
OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(p1/p2)
```
Returns 1-hop and 2-hop prerequisites with their mastery levels. Weak prerequisites (mastery < 0.5) trigger a mandatory reinforcement instruction in the passage prompt.

**Writes (after every session):**
```cypher
MERGE (s)-[k:KNOWS]->(t)
SET k.mastery = $chapterMastery, k.attempts = $totalAttempts, k.lastAttempted = $now
```
Chapter mastery in Neo4j = `sum(subtopicMasteries) / totalSubtopics`.

**Knowledge gap query (on quiz submission):**
```cypher
MATCH (t:Topic {id: $topicId})-[:REQUIRES]->(prereq:Topic)
OPTIONAL MATCH (s:Student {id: $studentId})-[k:KNOWS]->(prereq)
WHERE coalesce(k.mastery, 0) < 0.5
RETURN prereq.id, prereq.name, k.mastery
```
Returns knowledge gaps sent to the frontend for display.

---

## 8. API Routes

| Method | Route | Handler | What it does |
|---|---|---|---|
| `GET` | `/students/:id/graph` | graph.controller | Chapter progress + Neo4j mastery for all topics |
| `GET` | `/students/:id/topic/:topicId` | graph.controller | Single topic mastery from Neo4j |
| `POST` | `/content/generate` | content.controller | Start new session (generate or retrieve from bank) |
| `GET` | `/content/session/:id` | content.controller | Get existing session state |
| `POST` | `/quiz/submit-answer` | quiz.controller | Submit one answer (adaptive mode) |
| `POST` | `/quiz/submit` | quiz.controller | Submit all 5 answers (batch mode) |
| `GET` | `/quiz/attempt/:sessionId` | quiz.controller | Get attempt results |
| `GET` | `/quiz/session/:id/state` | quiz.controller | Get current session state |
| `GET` | `/subtopics/:id/progress` | subtopics.controller | Chapter progress for a topic |
| `GET` | `/subtopics/all-progress` | subtopics.controller | All chapters progress |
| `GET` | `/subtopics/:id/context` | subtopics.controller | Student context for subtopic |

---

## 9. Data Flow: Answer to Mastery Update

When a student submits one answer, this is the complete sequence:

```
POST /quiz/submit-answer
  { studentId, sessionId, questionIndex, chosenAnswer }

1. Load Session from PostgreSQL
2. Find question in pool by index
3. isCorrect = chosenAnswer === question.correctIndex
4. Find Concept by conceptTag
5. conceptService.updateConceptMastery(studentId, conceptId, isCorrect, cogLevel, difficulty)
   │
   ├── currentScore = isCorrect ? 1.0 : 0.0
   ├── velocity = currentScore - prevLastScore
   ├── scoreWeight = isCorrect ? difficulty : 1 - difficulty
   ├── alpha = 0.6 (1st attempt) | 0.4 (2nd) | 0.3 (3rd+)
   ├── newMastery = prevMastery + alpha × scoreWeight × (currentScore - prevMastery)
   ├── computeUpdatedHalfLife() → new halfLifeDays, consecutiveCorrect, consecutiveWrong
   ├── computeRetention(now, halfLifeDays) → retentionScore
   ├── Update cognitive level score (recallScore / vocabularyScore / etc.)
   └── Upsert ConceptMastery

6. questionBankService.updateQuestionIRT(bankQuestionId, isCorrect) [async, non-blocking]
7. If wrong: find backup question, push to pendingRetries
8. resolveNextQuestion() → next question to show, or null
9. Update Session (shownQuestions, pendingRetries, totalShown, totalCorrect, status)
10. If sessionComplete:
    a. Create QuizAttempt
    b. subtopicService.updateSubtopicMastery()
       └── getConceptsForSubtopic() → compute effectiveMastery for each concept
           → newSubtopicMastery = mean(effectiveMasteries)
           → isComplete = mastery ≥ 0.6 AND all concepts ≥ 0.3
           → Upsert SubtopicMastery
           → syncChapterMasteryToNeo4j() → SET k.mastery on KNOWS edge
    c. passageBankService.updatePassageQuality()
    d. If justCompleted: triggerPreemptiveGeneration() [async, fire-and-forget]
11. Return { isCorrect, nextQuestion, summary }
```

---

## 10. Benefits & Design Rationale

### Why Exponential Decay (Not Linear)?

Linear decay would predict constant forgetting — equal loss per day regardless of how long ago you studied. Exponential decay matches observed human memory: forgetting is fastest immediately after learning and slows dramatically over time. A student who studied yesterday and one who studied 30 days ago should be treated very differently.

### Why Separate Half-Life Per Concept?

A student might have mastered "ionic bonding" (long half-life, no review needed) while struggling with "lattice energy" (short half-life, needs daily review). A single decay rate per student would either waste time reviewing mastered concepts or under-review weak ones. Per-concept half-life is the core insight from Duolingo's HLR paper.

### Why Velocity?

Retention decay is a slow signal — it takes days or weeks to meaningfully change effective mastery. Velocity is a fast signal — it fires the moment a student's performance changes direction. Without velocity, a student who just got 3 wrong in a row on a "mastered" concept would still look strong until the decay catches up. Velocity corrects this immediately.

### Why Bloom's Taxonomy Per-Level Scores?

A student might be able to recall "what is ionization energy" but fail to apply it to predict periodic trends. A single mastery score obscures this gap. Per-level scores let the system target the specific cognitive operation the student is struggling with, not just the concept broadly.

### Why IRT Discrimination Index?

A question that 95% of students get right doesn't tell you much about who understands the concept. A question that 50% get right maximally differentiates the prepared from the unprepared. Sorting by discrimination index means the system serves the most informative questions first.

### Why Preemptive Generation?

Claude Haiku takes 3–8 seconds to generate a passage and questions. Without preemptive generation, the student would wait every time they complete a subtopic. Firing generation in the background when a student completes one subtopic means the next one is ready immediately.

### Why Neo4j for Prerequisites?

Prerequisite relationships form a directed acyclic graph (not a table). Querying "give me all prerequisites of this topic, and their prerequisites" is a graph traversal — natural in Cypher, awkward in SQL. Neo4j also allows the system to write per-student mastery directly on the relationship edge (`KNOWS`), keeping graph queries fast without joins.

---

## 11. What Is Implemented vs. What Is Planned

### Implemented

| Feature | Status | Primary Files |
|---|---|---|
| Exponential forgetting curve | Complete | `concept.service.ts` |
| Per-concept half-life progression | Complete | `concept.service.ts` |
| Learning velocity | Complete | `concept.service.ts` |
| Effective mastery (decay × velocity) | Complete | `concept.service.ts` |
| Bloom's Taxonomy per-level tracking | Complete | `concept.service.ts` |
| Streak-based half-life advancement | Complete | `concept.service.ts` |
| IRT difficulty calibration | Complete | `question.bank.service.ts` |
| Discrimination index | Complete | `question.bank.service.ts` |
| Adaptive question allocation | Complete | `content.service.ts` |
| Forgetting alert in prompts | Complete | `content.service.ts` |
| Passage bank (reuse/dedup) | Complete | `passage.bank.service.ts` |
| Question bank (reuse/dedup) | Complete | `question.bank.service.ts` |
| Seen-content deduplication | Complete | `StudentSeenContent` table |
| Prerequisite graph (Neo4j) | Complete | `subtopics.service.ts` |
| Chapter mastery sync to Neo4j | Complete | `subtopics.service.ts` |
| Adaptive retry questions on wrong | Complete | `quiz.service.ts` |
| Preemptive content generation | Complete | `preemptive.service.ts` |
| Class 11 / 12 grade profiles | Complete | `content.service.ts` |
| Subtopic sequential unlock | Complete | `subtopics.service.ts` |
| Review due detection | Complete | `concept.service.ts` |

### Architecture Ready For (Not Yet Active)

| Feature | What Would Enable It |
|---|---|
| Learned half-life (HLR model) | Replace rule-based `HALF_LIFE_PROGRESSION` with regression on `conceptMastery` table data once sufficient records accumulate |
| Spaced repetition scheduler | `getDueForReview()` is implemented — needs a scheduled job or API endpoint to surface due concepts to the student |
| Concept-level variance alerting | `scoreVariance` is tracked — can trigger "inconsistent performance" alerts |
| Cross-session misconception memory | Wrong questions from last 3 sessions are already passed to the prompt |
| Per-student question difficulty calibration | IRT is per-question globally; extending to per-student ability estimation (`θ`) would enable 3-PL IRT |
