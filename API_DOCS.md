# LearnGraph Backend — API Reference

**Base URL:** `http://localhost:3000`  
**All responses:** `Content-Type: application/json`  
**Success envelope:** `{ "success": true, "data": <payload> }`  
**Error envelope:** `{ "success": false, "error": "<message>" }`

---

## Table of Contents

1. [Students](#1-students)
2. [Subtopics & Progress](#2-subtopics--progress)
3. [Content Generation](#3-content-generation)
4. [Quiz — Adaptive Flow](#4-quiz--adaptive-flow)
5. [Quiz — Legacy Batch Flow](#5-quiz--legacy-batch-flow)
6. [Knowledge Graph](#6-knowledge-graph)
7. [Data Models Reference](#7-data-models-reference)
8. [Frontend Integration Guide](#8-frontend-integration-guide)

---

## 1. Students

### POST `/api/students`
Create a new student or return existing one (upsert by name).  
**Call this once on first launch / login screen.**

**Request body:**
```json
{ "name": "Ayush" }
```

**Rules:** Name must be 2–50 characters, letters/spaces/punctuation only. Stored in lowercase.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmo9abc123",
    "name": "ayush",
    "createdAt": "2026-04-22T10:00:00.000Z",
    "updatedAt": "2026-04-22T10:00:00.000Z"
  }
}
```

> **Store `data.id` as `studentId` in your app state — every other endpoint needs it.**

---

### GET `/api/students/:id`
Fetch a student by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmo9abc123",
    "name": "ayush",
    "createdAt": "2026-04-22T10:00:00.000Z",
    "updatedAt": "2026-04-22T10:00:00.000Z"
  }
}
```

---

### GET `/api/students/:id/history`
Fetch a student with their last 10 sessions and quiz attempts.  
**Use for profile / history screens.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmo9abc123",
    "name": "ayush",
    "sessions": [
      {
        "id": "session_id",
        "subtopicId": "c12_electrochemistry_s1",
        "sessionStatus": "complete",
        "totalShown": 7,
        "totalCorrect": 5,
        "createdAt": "2026-04-22T10:00:00.000Z",
        "subtopic": {
          "id": "c12_electrochemistry_s1",
          "name": "Electrochemical Cells and EMF",
          "topicId": "c12_electrochemistry",
          "order": 1,
          "classLevel": 12,
          "subject": "Chemistry"
        },
        "quizAttempt": null
      }
    ]
  }
}
```

---

## 2. Subtopics & Progress

### GET `/api/subtopics/topics`
Get all chapters (topics) for a subject. Use for the **chapter selection / home screen**.

**Query params:**
| Param | Required | Example |
|-------|----------|---------|
| `subject` | ✅ | `Chemistry` |
| `classLevel` | ❌ | `12` |

**Example:** `GET /api/subtopics/topics?subject=Chemistry&classLevel=12`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c12_electrochemistry",
      "name": "Electrochemistry",
      "classLevel": 12,
      "subject": "Chemistry",
      "totalSubtopics": 5
    }
  ]
}
```

---

### GET `/api/subtopics/all-progress`
Get progress across ALL chapters for a student. Use for the **dashboard / home screen**.

**Query params:**
| Param | Required | Example |
|-------|----------|---------|
| `studentId` | ✅ | `cmo9abc123` |
| `subject` | ✅ | `Chemistry` |
| `classLevel` | ❌ | `12` |

**Example:** `GET /api/subtopics/all-progress?studentId=xxx&subject=Chemistry&classLevel=12`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "topicId": "c12_electrochemistry",
      "topicName": "Electrochemistry",
      "classLevel": 12,
      "subject": "Chemistry",
      "totalSubtopics": 5,
      "completedSubtopics": 2,
      "currentSubtopicId": "c12_electrochemistry_s3",
      "chapterMastery": 0.42,
      "subtopics": [
        {
          "subtopicId": "c12_electrochemistry_s1",
          "subtopicName": "Electrochemical Cells and EMF",
          "order": 1,
          "mastery": 0.85,
          "attempts": 2,
          "isComplete": true,
          "isUnlocked": true,
          "isCurrent": false,
          "trend": "improving",
          "lastAttempted": "2026-04-22T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

**`trend`** values: `"improving"` | `"declining"` | `"stable"` | `null`

---

### GET `/api/subtopics/:topicId/progress`
Get detailed progress for a single chapter.

**Query params:** `studentId` (required)

**Example:** `GET /api/subtopics/c12_electrochemistry/progress?studentId=xxx`

**Response:** Same shape as one item inside `all-progress` data array above.

---

### GET `/api/subtopics/:topicId/current`
Get the current active subtopic for a student in a chapter.  
**Use when student taps "Continue" on a chapter.**

**Query params:** `studentId` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "subtopicId": "c12_electrochemistry_s2",
      "subtopicName": "Nernst Equation and Gibbs Energy",
      "order": 2,
      "mastery": 0,
      "attempts": 0,
      "isComplete": false,
      "isUnlocked": true,
      "isCurrent": true,
      "trend": null,
      "lastAttempted": null
    },
    "chapterProgress": {
      "totalSubtopics": 5,
      "completedSubtopics": 1,
      "chapterMastery": 0.17
    }
  }
}
```

---

### GET `/api/subtopics/:subtopicId/concepts`
Get concept-level mastery breakdown for a subtopic.  
**Use on the subtopic detail / pre-quiz screen to show what the student knows.**

**Query params:** `studentId` (required)

**Example:** `GET /api/subtopics/c12_electrochemistry_s1/concepts?studentId=xxx`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "conceptId": "c12_electrochemistry_s1_galvanic_cell",
      "conceptName": "Galvanic Cell Construction",
      "tag": "galvanic_cell",
      "effectiveMastery": 0.85,
      "mastery": 1.0,
      "velocity": 1.0,
      "consecutiveWrong": 0,
      "halfLifeDays": 1,
      "retentionScore": 0.85,
      "recallScore": 1.0,
      "vocabularyScore": 0.6,
      "causeEffectScore": 0,
      "inferenceScore": 0,
      "applicationScore": 0,
      "daysSinceAttempt": 0.02,
      "attempts": 2
    }
  ]
}
```

**Key fields for UI:**
- `effectiveMastery` — mastery × forgetting curve decay × velocity (0–1). Use this for progress bars.
- `mastery` — raw mastery without decay (0–1)
- `retentionScore` — how much the student remembers right now (0–1)
- `daysSinceAttempt` — null if never attempted
- `velocity` — positive = improving, negative = declining

---

### GET `/api/subtopics/:studentId/review-due`
Get concepts the student is forgetting (retention has dropped significantly).  
**Use for spaced-repetition reminders / review screen.**

**Example:** `GET /api/subtopics/cmo9abc123/review-due`

**Response:** Array of concept objects (same shape as `/concepts` response above).  
Returns `[]` if nothing is due for review.

---

## 3. Content Generation

### POST `/api/content/generate`
Generate a reading passage + 8 questions for a subtopic.  
**This is the main call before a quiz session starts.**  
Rate limited: 10 requests per 15 minutes per student.

> First call hits Claude AI (~3–5 seconds). Subsequent calls for the same subtopic are served from the bank instantly.

**Request body:**
```json
{
  "studentId": "cmo9abc123",
  "subtopicId": "c12_electrochemistry_s1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cmo9xyz789",
    "title": "Powering India: Understanding Electrochemical Cells",
    "passage": "Every time you start your car in Mumbai traffic...",
    "questions": [
      {
        "index": 0,
        "cognitiveLevel": "recall",
        "conceptTag": "galvanic_cell",
        "difficulty": 0.2,
        "question": "In the Daniel cell, which two metals are used as electrodes?",
        "options": [
          "A. Iron and copper",
          "B. Zinc and copper",
          "C. Zinc and silver",
          "D. Lead and copper"
        ],
        "correctIndex": 1,
        "explanation": "The passage states 'zinc and copper electrodes...'"
      }
    ],
    "subtopic": {
      "id": "c12_electrochemistry_s1",
      "name": "Electrochemical Cells and EMF",
      "order": 1,
      "topicId": "c12_electrochemistry",
      "classLevel": 12,
      "subject": "Chemistry"
    },
    "source": "generated"
  }
}
```

**Notes:**
- `questions` always has exactly **5 items** (index 0–4). Backup questions exist server-side and are served adaptively.
- `source`: `"generated"` = fresh from Claude, `"bank"` = cached (instant)
- `cognitiveLevel` values: `recall` | `vocabulary` | `cause_and_effect` | `inference` | `application`
- `difficulty`: float 0.0–1.0 (0.2 = easy, 0.5 = medium, 0.8 = hard)
- **Store `sessionId`** — needed for all quiz calls.

---

### GET `/api/content/session/:sessionId`
Fetch a full session (passage + questions + metadata).  
**Use to restore a session if the user leaves mid-quiz.**

**Query params:** `studentId` (required)

**Response:** Full session object from the database (includes `sessionStatus`, `totalShown`, `totalCorrect`, `passage`, `questions`).

---

## 4. Quiz — Adaptive Flow

This is the primary quiz flow. Questions are served one at a time. Wrong answers trigger backup questions automatically.

---

### GET `/api/quiz/session/:id/state`
Get the current state of a session — which question to show next, how far along the student is.  
**Call this to restore UI state if the app is reopened mid-session.**

**Query params:** `studentId` (required)

**Example:** `GET /api/quiz/session/cmo9xyz789/state?studentId=xxx`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cmo9xyz789",
    "subtopicId": "c12_electrochemistry_s1",
    "sessionStatus": "active",
    "totalShown": 3,
    "totalCorrect": 2,
    "pendingRetriesCount": 1,
    "primaryRemaining": 2,
    "currentQuestion": {
      "index": 5,
      "cognitiveLevel": "vocabulary",
      "question": "What does EMF stand for and what does it measure?",
      "options": [
        "A. Electromotive force...",
        "B. Electromagnetic flux...",
        "C. Electron mass factor...",
        "D. Electrode molar force..."
      ],
      "conceptTag": "emf_measurement",
      "difficulty": 0.35
    }
  }
}
```

**`sessionStatus`** values: `"active"` | `"complete"`  
`currentQuestion` is `null` when session is complete.

---

### POST `/api/quiz/answer`
Submit one answer. Returns whether it was correct, an explanation, and the next question.  
**Core adaptive loop — call this after every answer.**

**Request body:**
```json
{
  "studentId": "cmo9abc123",
  "sessionId": "cmo9xyz789",
  "questionIndex": 0,
  "chosenAnswer": 1
}
```

- `questionIndex` — use `currentQuestion.index` or `nextQuestion.index` from the previous response
- `chosenAnswer` — 0, 1, 2, or 3 (index of the selected option)

**Response (mid-session):**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctIndex": 1,
    "explanation": "The passage states 'zinc and copper electrodes...'",
    "conceptTag": "galvanic_cell",
    "totalShown": 1,
    "totalCorrect": 1,
    "sessionComplete": false,
    "nextQuestion": {
      "index": 1,
      "cognitiveLevel": "recall",
      "question": "What process occurs at the anode?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "conceptTag": "electrode_reactions",
      "difficulty": 0.2
    },
    "summary": null
  }
}
```

**Response (session complete):**
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "correctIndex": 2,
    "explanation": "...",
    "conceptTag": "emf_measurement",
    "totalShown": 8,
    "totalCorrect": 6,
    "sessionComplete": true,
    "nextQuestion": null,
    "summary": {
      "score": 6,
      "total": 8,
      "percentage": 75,
      "grade": "Good"
    }
  }
}
```

**`grade`** values: `"Excellent"` (≥80%) | `"Good"` (≥60%) | `"Needs Practice"` (≥40%) | `"Keep Trying"` (<40%)

**Adaptive behaviour:**
- If a wrong answer is given, the server automatically queues a backup question targeting the same concept before moving to the next primary question. This is invisible to the frontend — just always use `nextQuestion.index` for the next call.
- Session ends when `sessionComplete: true` (max 10 questions shown, or all questions exhausted).
- After completion, `/api/subtopics/:topicId/progress` will reflect updated mastery.

**Loop pattern:**
```
generate → get session state → submit answer (index 0)
  → submit answer (nextQuestion.index) → ... → sessionComplete: true
```

---

## 5. Quiz — Legacy Batch Flow

Submit all 5 answers at once. Kept for backward compatibility. **Prefer the adaptive flow above.**

### POST `/api/quiz/submit`

**Request body:**
```json
{
  "studentId": "cmo9abc123",
  "sessionId": "cmo9xyz789",
  "answers": [1, 0, 2, 1, 3]
}
```
`answers` must be exactly 5 integers, each 0–3.

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 4,
    "total": 5,
    "percentage": 80,
    "grade": "Excellent",
    "answerResults": [
      {
        "questionIndex": 0,
        "cognitiveLevel": "recall",
        "question": "In the Daniel cell...",
        "chosen": 1,
        "correct": 1,
        "isCorrect": true,
        "explanation": "The passage states..."
      }
    ],
    "subtopicResult": {
      "subtopicId": "c12_electrochemistry_s1",
      "subtopicName": "Electrochemical Cells and EMF",
      "subtopicOrder": 1,
      "previousMastery": 0,
      "newMastery": 0.72,
      "isComplete": true,
      "justCompleted": true,
      "trend": "improving",
      "nextSubtopicId": "c12_electrochemistry_s2",
      "chapterMastery": 0.14
    },
    "knowledgeGaps": [
      {
        "topicId": "c11_redox",
        "topicName": "Redox Reactions",
        "mastery": 0.0
      }
    ],
    "message": "Good work — Electrochemical Cells and EMF is now complete!"
  }
}
```

---

### GET `/api/quiz/attempt/:sessionId`
Fetch a completed quiz attempt with full results.  
**Use for the results screen if user navigates away and comes back.**

**Query params:** `studentId` (required)

**Response:** Full attempt object with session, subtopic, and answers array.

---

## 6. Knowledge Graph

These endpoints require Neo4j to be running.

### GET `/api/graph/:studentId`
Full knowledge graph for a student — all topics as nodes with mastery, all prerequisite edges.  
**Use for the graph visualisation screen.**

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "c12_electrochemistry",
        "name": "Electrochemistry",
        "subject": "Chemistry",
        "classLevel": 12,
        "mastery": 0.72,
        "attempts": 3,
        "trend": "improving",
        "lastAttempted": "2026-04-22T10:00:00.000Z",
        "masteryLevel": "proficient"
      }
    ],
    "edges": [
      {
        "source": "c12_electrochemistry",
        "target": "c11_redox",
        "type": "REQUIRES"
      }
    ],
    "stats": {
      "totalTopics": 25,
      "attempted": 3,
      "mastered": 1,
      "struggling": 0,
      "averageMastery": 0.24
    }
  }
}
```

**`masteryLevel`** values: `"not_started"` | `"struggling"` | `"developing"` | `"proficient"` | `"mastered"`  
**`type`** values: `"REQUIRES"` | `"RELATED_TO"`

---

### GET `/api/graph/:studentId/filtered`
Same as above but filtered to one subject / class level.

**Query params:**
| Param | Required |
|-------|----------|
| `subject` | ✅ |
| `classLevel` | ❌ |

---

### GET `/api/graph/:studentId/recommendations`
Get recommended topics to study next (not yet mastered, prerequisites satisfied).  
**Use for "What should I study next?" feature.**

**Query params:** `subject` (required), `classLevel` (default: 12), `limit` (default: 3)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c12_solutions",
      "name": "Solutions",
      "classLevel": 12,
      "mastery": 0.0,
      "attempts": 0,
      "masteryLevel": "not_started"
    }
  ]
}
```

---

### GET `/api/graph/:studentId/topic/:topicId`
Get mastery for a single topic/chapter.

**Response:**
```json
{
  "success": true,
  "data": {
    "topicId": "c12_electrochemistry",
    "topicName": "Electrochemistry",
    "classLevel": 12,
    "mastery": 0.72,
    "attempts": 3,
    "trend": "improving",
    "lastAttempted": "2026-04-22T10:00:00.000Z",
    "masteryLevel": "proficient"
  }
}
```

---

## 7. Data Models Reference

### Mastery levels
| Value | Mastery range | Meaning |
|-------|--------------|---------|
| `not_started` | attempts = 0 | Never attempted |
| `struggling` | < 0.4 | Needs significant help |
| `developing` | 0.4–0.6 | Making progress |
| `proficient` | 0.6–0.8 | Good understanding |
| `mastered` | ≥ 0.8 | Excellent command |

### Cognitive levels (question types)
| Value | Description |
|-------|-------------|
| `recall` | Direct fact from passage |
| `vocabulary` | Chemical term understanding |
| `cause_and_effect` | Why something happens |
| `inference` | Logical conclusion not directly stated |
| `application` | Real-world scenario |

### Subject / Class values
- Subject: `"Chemistry"` (only supported value currently)
- classLevel: `11` or `12`

### Subtopic ID format
`{chapter_id}_s{order}` — e.g. `c12_electrochemistry_s1`

### Concept ID format
`{subtopicId}_{tag}` — e.g. `c12_electrochemistry_s1_galvanic_cell`

---

## 8. Frontend Integration Guide

### Recommended app flow

```
App opens
  └─ POST /api/students  →  save studentId

Home / Dashboard
  └─ GET /api/subtopics/all-progress?studentId&subject&classLevel
  └─ GET /api/graph/:studentId/recommendations

Chapter screen (user taps a chapter)
  └─ GET /api/subtopics/:topicId/progress?studentId
  └─ GET /api/subtopics/:topicId/current?studentId

Subtopic detail screen (user taps a subtopic)
  └─ GET /api/subtopics/:subtopicId/concepts?studentId  ← show mastery bars

Start quiz (user taps "Start")
  └─ POST /api/content/generate  →  save sessionId, display passage + Q1

Quiz loop (one question at a time)
  └─ Display currentQuestion from generate response (index 0)
  └─ User answers → POST /api/quiz/answer
  └─ Show isCorrect + explanation
  └─ Display nextQuestion  →  repeat until sessionComplete: true

Results screen
  └─ Display summary (score, percentage, grade)
  └─ GET /api/subtopics/:topicId/progress?studentId  ← updated mastery

Review reminder screen
  └─ GET /api/subtopics/:studentId/review-due  ← concepts to revise

Knowledge graph screen
  └─ GET /api/graph/:studentId/filtered?subject&classLevel
```

### Error handling

All errors return:
```json
{ "success": false, "error": "Human readable message" }
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad request — missing or invalid field |
| 404 | Resource not found |
| 409 | Conflict — session already attempted / question already answered |
| 429 | Rate limited (content generation) — wait and retry |
| 500 | Server error — show generic retry message |

### Rate limiting
`POST /api/content/generate` is limited to **10 requests per 15 minutes per student**. On 429, show a "Please wait a moment before generating more content" message.

### Notes for the frontend engineer
- All `mastery`, `effectiveMastery`, `retentionScore` values are floats from 0 to 1. Multiply by 100 for percentages.
- `daysSinceAttempt` is in decimal days (e.g. `0.5` = 12 hours ago). Can be `null` if never attempted.
- The adaptive quiz (`/api/quiz/answer`) always tells you what the next question index is. Never hardcode question order — always read `nextQuestion.index` from each response.
- On session restore (app reopen mid-quiz), call `GET /api/quiz/session/:id/state` to get `currentQuestion` and resume from there.
- The graph endpoints (`/api/graph/*`) depend on Neo4j. If Neo4j is down, these will return 500. Handle gracefully — the rest of the app works without it.
