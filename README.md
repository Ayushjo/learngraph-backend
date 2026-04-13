# LearnGraph Backend

Adaptive learning platform backend for Indian high school Chemistry (Classes 11 & 12, NCERT-aligned). Uses AI-generated content, mastery tracking, and a knowledge graph to personalize learning paths.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js v5 |
| AI | Anthropic Claude API |
| Relational DB | PostgreSQL via Neon (serverless) + Prisma ORM |
| Graph DB | Neo4j Aura (cloud) |
| Validation | Zod |
| Rate Limiting | express-rate-limit |

## Prerequisites

- Node.js >= 18
- npm >= 9
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- A [Neo4j Aura](https://neo4j.com/cloud/aura/) database (free tier works)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL (Neon serverless connection string)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# Server
PORT=3700

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5174
```

### 3. Set up the PostgreSQL schema

Push the Prisma schema to your Neon database:

```bash
npm run db:push
```

Generate the Prisma client:

```bash
npm run db:generate
```

### 4. Seed the databases

Seed both databases with the Chemistry curriculum (Classes 11 & 12, ~28 chapters, ~140 subtopics):

```bash
npm run db:seed
```

This runs both seeds in sequence:
- `db:seed:postgres` — inserts all subtopic records into PostgreSQL
- `db:seed:neo4j` — creates Topic and Subtopic nodes, REQUIRES, RELATED_TO, HAS_SUBTOPIC, and NEXT_SUBTOPIC edges in Neo4j

### 5. Start the server

**Development** (auto-reloads on file changes):

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm run start
```

Server runs on `http://localhost:3700` (or the `PORT` you configured).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon (watches `src/**/*.ts`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build from `dist/` |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push Prisma schema changes to the database |
| `npm run db:seed` | Seed both PostgreSQL and Neo4j |
| `npm run db:seed:postgres` | Seed only PostgreSQL subtopics |
| `npm run db:seed:neo4j` | Seed only Neo4j graph (clears existing data first) |

## API Endpoints

Base URL: `http://localhost:3700`

### Health
```
GET /api/health
```

### Students
```
POST   /api/students              — Find or create a student by name
GET    /api/students/:id          — Get student by ID
GET    /api/students/:id/history  — Get student with last 10 quiz sessions
```

### Content Generation (AI)
```
POST  /api/content/generate                — Generate passage + quiz questions (rate limited: 10 req / 15 min)
GET   /api/content/session/:sessionId      — Retrieve a session (query: ?studentId=)
```

### Quiz
```
POST  /api/quiz/submit                     — Submit quiz answers
GET   /api/quiz/attempt/:sessionId         — Retrieve a past attempt (query: ?studentId=)
```

### Knowledge Graph
```
GET   /api/graph/:studentId                — Full student knowledge graph
GET   /api/graph/:studentId/filtered       — Filtered subgraph (query: ?subject=&classLevel=)
GET   /api/graph/:studentId/recommendations — Study recommendations (query: ?subject=&classLevel=&limit=)
GET   /api/graph/:studentId/topic/:topicId — Mastery for a specific topic
```

### Chapters & Subtopics
```
GET   /api/subtopics/topics                — All chapters (query: ?subject=&classLevel=)
GET   /api/subtopics/all-progress          — All chapters with subtopic progress (query: ?studentId=&subject=&classLevel=)
GET   /api/subtopics/:topicId/progress     — Subtopics progress for a chapter (query: ?studentId=)
GET   /api/subtopics/:topicId/current      — Next subtopic to study (query: ?studentId=)
```

## Project Structure

```
src/
├── config/
│   └── env.ts                  # Environment variable validation (fails fast if missing)
├── controllers/                # Route handlers (request parsing, response shaping)
│   ├── student.controller.ts
│   ├── content.controller.ts
│   ├── quiz.controller.ts
│   ├── graph.controller.ts
│   └── subtopic.controller.ts
├── services/                   # Business logic
│   ├── student.service.ts
│   ├── content.service.ts      # Claude API integration + prompt engineering
│   ├── quiz.service.ts         # Scoring, mastery calculation
│   ├── neo4j.service.ts        # Graph queries and sync
│   ├── subtopics.service.ts    # Chapter/subtopic unlock logic
│   └── mastery.service.ts      # EMA mastery algorithm
├── routes/                     # Express route definitions
├── db/
│   ├── prisma.ts               # PostgreSQL client
│   └── neo4j.ts                # Neo4j client
├── middleware/
│   ├── errorHandler.ts         # Centralized error responses
│   └── rateLimiter.ts          # Per-student rate limiting
├── data/
│   └── subtopics.ts            # Full NCERT curriculum data
├── seed/
│   ├── postgres.seed.ts
│   └── neo4j.seed.ts
└── index.ts                    # Server entry point
prisma/
└── schema.prisma               # Database schema
```

## How It Works

1. **Student enters name** → backend finds or creates a `Student` record
2. **Student picks a chapter** → system returns the current unlocked subtopic
3. **Content generation** → Claude generates a 220–260 word passage + 5 MCQs adapted to the student's mastery level and past mistakes
4. **Quiz submission** → answers are scored, mastery updated via exponential moving average, Neo4j graph synced
5. **Unlock progression** → next subtopic unlocks only after achieving >= 0.6 mastery
6. **Knowledge graph** → Neo4j tracks topic prerequisites and mastery for recommendations

## Notes

- Re-running `npm run db:seed:neo4j` **clears all graph data** and re-seeds from scratch.
- The server will refuse to start if any required environment variable is missing.
- Content generation is rate-limited to 10 requests per 15 minutes per student to control Claude API costs.
- There is currently no user authentication — students are identified purely by their ID.
