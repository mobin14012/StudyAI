# Architecture Research

**Domain:** AI-powered personalized study platform
**Researched:** 2026-03-17
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React SPA)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth    │ │Dashboard │ │ Practice │ │ Upload   │ │Analytics │ │
│  │  Pages   │ │  Page    │ │  Engine  │ │  Flow    │ │  Page    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │            │            │        │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴─────┐  │
│  │                    API Client / Auth Layer                    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
├─────────────────────────────┼───────────────────────────────────────┤
                              │ HTTPS / REST
├─────────────────────────────┼───────────────────────────────────────┤
│                     BACKEND (Node.js / Express)                     │
├─────────────────────────────┼───────────────────────────────────────┤
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │                     API Router Layer                          │  │
│  │  /auth  /users  /materials  /questions  /attempts  /analytics│  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────┐  ┌────────────┴──────────┐  ┌───────────────────┐   │
│  │  Auth    │  │    Service Layer       │  │   AI Service      │   │
│  │Middleware│  │ (Business Logic)       │  │   (OpenAI)        │   │
│  └──────────┘  └────────────┬──────────┘  └────────┬──────────┘   │
│                             │                      │               │
│  ┌──────────────────────────┴──────────────────────┴────────────┐  │
│  │                     Data Access Layer                         │  │
│  │              (Mongoose Models / Repositories)                 │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
├─────────────────────────────┼───────────────────────────────────────┤
                              │
├─────────────────────────────┼───────────────────────────────────────┤
│                        DATA LAYER                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Users   │  │Materials │  │Questions │  │ Attempts /       │   │
│  │          │  │          │  │          │  │ WeakTopics       │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                       MongoDB Atlas                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Auth Pages | Registration, login, JWT token storage | React forms + localStorage/httpOnly cookie for JWT |
| Dashboard | Landing page after login; streak, goals, recent activity | React page consuming `/analytics/summary` |
| Practice Engine | Question display, answer submission, feedback loop | Stateful React component with question queue |
| Upload Flow | PDF upload, topic review, generation trigger | Multi-step form: upload -> preview topics -> confirm |
| Analytics Page | Charts for accuracy, weak topics, progress over time | React + chart library (Recharts / Chart.js) |
| API Router Layer | Route definitions, request validation, response formatting | Express Router per resource |
| Auth Middleware | JWT verification, user injection into `req` | Express middleware using `jsonwebtoken` |
| Service Layer | Business logic (scoring, adaptive logic, CRUD orchestration) | Plain JS/TS classes or modules |
| AI Service | All OpenAI API interactions (question gen, eval, summaries, chat) | Dedicated module wrapping OpenAI SDK |
| Data Access Layer | MongoDB operations via Mongoose models | Mongoose schemas + model methods |

## Recommended Project Structure

```
studyai/
├── client/                     # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                # API client functions (axios instance, endpoints)
│   │   │   ├── client.js       # Axios instance with interceptors (JWT attach, refresh)
│   │   │   ├── auth.js         # login(), register(), getProfile()
│   │   │   ├── materials.js    # uploadMaterial(), getTopics(), generateQuestions()
│   │   │   ├── questions.js    # getQuestions(), submitAnswer()
│   │   │   └── analytics.js    # getStats(), getWeakTopics()
│   │   ├── components/         # Shared UI components
│   │   │   ├── Layout/         # AppShell, Sidebar, Header
│   │   │   ├── Question/       # QuestionCard, MCQOptions, ShortAnswerInput
│   │   │   ├── Upload/         # FileDropzone, TopicReview, GenerateButton
│   │   │   └── common/         # Button, Modal, Toast, ThemeToggle, Timer
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Practice.jsx
│   │   │   ├── Upload.jsx
│   │   │   └── Analytics.jsx
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx  # User state, login/logout, token management
│   │   │   └── ThemeContext.jsx # Dark/light mode
│   │   ├── hooks/              # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── usePractice.js  # Question queue logic, answer submission
│   │   │   └── useTimer.js     # Pomodoro timer
│   │   ├── styles/             # Global styles, theme variables
│   │   ├── utils/              # Helpers (formatDate, scoring helpers)
│   │   ├── App.jsx             # Root component with router
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js/Express backend
│   ├── src/
│   │   ├── config/             # App configuration
│   │   │   ├── db.js           # MongoDB connection
│   │   │   ├── env.js          # Environment variable validation
│   │   │   └── openai.js       # OpenAI client initialization
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── upload.js       # Multer config for PDF upload
│   │   │   ├── validate.js     # Request validation (Joi or Zod)
│   │   │   └── errorHandler.js # Centralized error handling
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Material.js
│   │   │   ├── Question.js
│   │   │   ├── Attempt.js
│   │   │   └── WeakTopic.js
│   │   ├── routes/             # Express route definitions
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── materials.js
│   │   │   ├── questions.js
│   │   │   ├── practice.js
│   │   │   └── analytics.js
│   │   ├── services/           # Business logic layer
│   │   │   ├── authService.js
│   │   │   ├── materialService.js
│   │   │   ├── questionService.js
│   │   │   ├── practiceService.js    # Adaptive logic, session management
│   │   │   ├── analyticsService.js
│   │   │   └── ai/                   # AI-specific services
│   │   │       ├── openaiClient.js   # Low-level OpenAI wrapper with retry/rate-limit
│   │   │       ├── questionGenerator.js  # Prompt engineering for question gen
│   │   │       ├── answerEvaluator.js    # Prompt engineering for answer eval
│   │   │       ├── summarizer.js         # Material summarization
│   │   │       └── chatTutor.js          # Conversational tutoring
│   │   ├── utils/              # Helpers
│   │   │   ├── pdfParser.js    # PDF text extraction (pdf-parse)
│   │   │   ├── topicDetector.js # AI-based topic extraction from text
│   │   │   └── tokenCounter.js  # Estimate OpenAI token usage
│   │   └── app.js              # Express app setup
│   ├── server.js               # Entry point (listen)
│   └── package.json
│
├── .planning/                  # Project planning docs
├── .env.example                # Environment variable template
└── README.md
```

### Structure Rationale

- **client/src/api/:** Isolates all HTTP calls. Every page imports from here, never calls fetch/axios directly. Makes backend URL changes trivial.
- **client/src/context/:** React Context over Redux for this scale. Auth and Theme are the only two global states needed. Practice state stays local to the Practice page.
- **server/src/services/ai/:** AI logic is the most complex and changes most often. Isolating each AI capability (question gen, answer eval, summarization, chat) into its own file keeps prompts maintainable and testable independently.
- **server/src/services/ (non-AI):** Business logic separated from routes. Routes handle HTTP (parse request, send response). Services handle logic (what to do). This separation makes unit testing straightforward.
- **server/src/models/:** One file per collection. Mongoose schemas define shape and validation at the data layer.

## Architectural Patterns

### Pattern 1: Service Layer Abstraction for AI

**What:** All OpenAI API calls go through a dedicated `openaiClient.js` wrapper. Individual AI features (question gen, answer eval, etc.) are separate modules that use this wrapper. Routes never call OpenAI directly.

**When to use:** Any project integrating LLM APIs where you need prompt versioning, retry logic, rate-limit handling, and cost tracking in one place.

**Trade-offs:**
- Pro: Swap AI providers without touching business logic. Centralized error handling, retry, and token tracking.
- Pro: Each AI feature has its own prompt template, easy to iterate independently.
- Con: Extra abstraction layer. For a solo project, might feel like overhead initially.

**Example:**
```javascript
// server/src/services/ai/openaiClient.js
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chatCompletion({ messages, model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 2000 }) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
    };
  } catch (error) {
    if (error.status === 429) {
      // Rate limited — wait and retry (or queue)
      await delay(2000);
      return chatCompletion({ messages, model, temperature, maxTokens });
    }
    throw error;
  }
}

module.exports = { chatCompletion };
```

```javascript
// server/src/services/ai/questionGenerator.js
const { chatCompletion } = require('./openaiClient');

async function generateQuestions({ text, topics, count = 5, difficulty = 'medium', types = ['mcq', 'short_answer', 'true_false'] }) {
  const prompt = buildQuestionPrompt({ text, topics, count, difficulty, types });
  const result = await chatCompletion({
    messages: [
      { role: 'system', content: 'You are an expert educator...' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
  });
  return parseQuestionResponse(result.content); // Parse JSON from AI response
}
```

### Pattern 2: Multi-Step Upload Pipeline

**What:** File processing broken into discrete, sequential steps: upload -> extract text -> detect topics -> (user reviews) -> generate questions. Each step is a separate API call from the frontend, not one monolithic request.

**When to use:** When a pipeline has a user-review checkpoint in the middle (the student must approve detected topics before generation).

**Trade-offs:**
- Pro: User stays in control. Can edit/remove detected topics before committing to generation. UX feels responsive (progress at each step).
- Pro: If question generation fails, the uploaded material and topics are already persisted. User retries only the failed step.
- Con: More API calls. Frontend needs to manage multi-step state.

**Example flow:**
```
Frontend                          Backend
   │                                 │
   │  POST /materials/upload         │
   │  (multipart/form-data: PDF)     │
   │ ──────────────────────────────► │
   │                                 │ ── extract text (pdf-parse)
   │                                 │ ── detect topics (OpenAI)
   │                                 │ ── save Material doc to MongoDB
   │  ◄─────────────────────────────│
   │  { materialId, extractedText,   │
   │    detectedTopics[] }           │
   │                                 │
   │  [User reviews & edits topics]  │
   │                                 │
   │  POST /materials/:id/generate   │
   │  { confirmedTopics[], count,    │
   │    difficulty, questionTypes }   │
   │ ──────────────────────────────► │
   │                                 │ ── generate questions (OpenAI)
   │                                 │ ── save Questions to MongoDB
   │  ◄─────────────────────────────│
   │  { questions[] }                │
```

### Pattern 3: Adaptive Practice Session

**What:** The practice engine selects questions based on the user's mode choice (general vs. weak-topic drill) and tracks performance per topic in real time. After each answer, the backend evaluates correctness, updates weak-topic scores, and optionally provides AI-generated explanations.

**When to use:** Any adaptive learning system where question selection depends on historical performance.

**Trade-offs:**
- Pro: Personalized experience without complex ML — simple weighted random selection based on mistake counts is effective.
- Con: Real-time AI evaluation on every answer adds latency and cost. Mitigation: evaluate MCQ locally (exact match), use AI only for short-answer evaluation.

**Implementation approach:**
```
General Practice:
  - Pull questions from all user's materials
  - Weight toward topics with higher mistake counts (70% weak, 30% random)
  - Mix question types

Weak-Topic Drill:
  - User selects a specific weak topic
  - Pull only questions tagged with that topic
  - Difficulty escalates as user improves (easy → medium → hard)
```

## Data Flow

### Request Flow (Standard CRUD)

```
[User Action in React]
    ↓
[API Client] → HTTP Request (JWT in Authorization header)
    ↓
[Express Router] → [Auth Middleware] → [Validation Middleware]
    ↓
[Route Handler] → [Service Layer] → [Mongoose Model] → [MongoDB]
    ↓                    ↓
[HTTP Response] ← [Formatted Result]
    ↓
[React State Update] → [UI Re-render]
```

### Authentication Flow

```
Register:
  Client POST /auth/register { email, password, name, level }
    → Hash password (bcrypt) → Save User → Return JWT + user profile

Login:
  Client POST /auth/login { email, password }
    → Find user → Compare hash → Generate JWT → Return JWT + user profile

Protected Route:
  Client sends Authorization: Bearer <jwt>
    → Auth middleware verifies → Attaches user to req → Route proceeds
```

### File Upload & Processing Flow (Critical Path)

```
┌────────────────────────────────────────────────────────────────────┐
│ STEP 1: Upload                                                      │
│                                                                      │
│  [React Dropzone] → POST /materials/upload (multipart)              │
│       ↓                                                              │
│  [Multer middleware] → Buffer PDF in memory                         │
│       ↓                                                              │
│  [materialService.processUpload()]                                  │
│       ↓                                                              │
│  [pdfParser.extractText(buffer)]                                    │
│       → Uses pdf-parse library                                      │
│       → Returns raw text string                                     │
│       ↓                                                              │
│  [topicDetector.detectTopics(text)]                                 │
│       → Sends text (or chunked summary) to OpenAI                   │
│       → Prompt: "Extract the main academic topics from this text"   │
│       → Returns: ["Photosynthesis", "Cell Respiration", ...]        │
│       ↓                                                              │
│  [Save to MongoDB: Material { userId, filename, text, topics }]     │
│       ↓                                                              │
│  Response: { materialId, topics, textPreview }                      │
└────────────────────────────────────────────────────────────────────┘
                              ↓
               [User reviews topics in UI]
               [Can add/remove/edit topics]
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 2: Generate Questions                                          │
│                                                                      │
│  POST /materials/:id/generate                                       │
│  { confirmedTopics, count, difficulty, questionTypes }              │
│       ↓                                                              │
│  [questionService.generateFromMaterial()]                            │
│       ↓                                                              │
│  [questionGenerator.generateQuestions()]                             │
│       → Chunks source text if > token limit                         │
│       → Sends to OpenAI with structured prompt                      │
│       → Requests JSON output with:                                  │
│           { text, type, options?, correctAnswer,                    │
│             explanation, topic, difficulty }                         │
│       ↓                                                              │
│  [Parse & validate AI response]                                     │
│       → Ensure valid JSON                                           │
│       → Validate required fields present                            │
│       → Validate question types match request                       │
│       ↓                                                              │
│  [Save to MongoDB: Question[] linked to Material & User]            │
│       ↓                                                              │
│  Response: { questions[] }                                          │
└────────────────────────────────────────────────────────────────────┘
```

### Practice Session Flow

```
[User clicks "Start Practice"]
    ↓
[Choose mode: General Practice | Weak-Topic Drill]
    ↓
GET /practice/session?mode=general|drill&topic=X
    ↓
[practiceService.buildSession()]
    → General: weighted random across all user questions
    → Drill: filter by selected topic, order by difficulty
    → Returns batch of ~10-20 questions (no answers included)
    ↓
[Frontend renders questions one-by-one]
    ↓
[User submits answer]
    ↓
POST /practice/answer { questionId, userAnswer, sessionId }
    ↓
[practiceService.evaluateAnswer()]
    → MCQ / True-False: direct string comparison (no AI needed)
    → Short Answer: AI evaluation via answerEvaluator
        → Prompt: "Compare student answer to correct answer. 
           Is it semantically correct? Score: correct/partial/incorrect.
           Provide brief feedback."
    ↓
[Update Attempt record in MongoDB]
[Update WeakTopic scores: increment mistakes on wrong, decrement on correct]
    ↓
Response: { isCorrect, correctAnswer, explanation, feedback }
    ↓
[Frontend shows feedback, loads next question]
```

### State Management (Frontend)

```
AuthContext (global)
    │
    ├── user: { id, name, email, level }
    ├── token: JWT string
    ├── login(), logout(), register()
    │
ThemeContext (global)
    │
    ├── theme: 'dark' | 'light'
    ├── toggleTheme()

Page-level state (local to each page):
    │
    ├── Dashboard: { stats, recentActivity, streak }
    ├── Practice: { questions[], currentIndex, answers[], sessionId }
    ├── Upload: { file, step, extractedTopics, confirmedTopics }
    └── Analytics: { chartData, weakTopics, filters }
```

### Key Data Flows

1. **Upload-to-Practice Pipeline:** PDF upload → text extraction → topic detection → user review → question generation → questions available in practice sessions. This is the critical end-to-end flow; if it breaks, the app has no content.
2. **Answer-to-Adaptation Loop:** User answers question → backend evaluates → updates attempt record → updates weak topic scores → next practice session reflects updated weights. This is the core learning loop.
3. **Analytics Aggregation:** Attempts collection → aggregate by topic/time/correctness → serve to analytics page. Read-heavy, can be cached or pre-computed.

## MongoDB Schema Design

### Collections & Key Fields

```
Users
├── _id
├── email (unique, indexed)
├── passwordHash
├── name
├── level: "junior" | "senior"
├── dailyGoal: Number (questions/day)
├── currentStreak: Number
├── lastActiveDate: Date
├── createdAt

Materials
├── _id
├── userId (indexed, ref: Users)
├── filename
├── originalText (full extracted text)
├── topics: [String]
├── textLength: Number
├── createdAt

Questions
├── _id
├── userId (indexed, ref: Users)
├── materialId (indexed, ref: Materials)
├── type: "mcq" | "short_answer" | "true_false"
├── difficulty: "easy" | "medium" | "hard"
├── text (question text)
├── options: [String] (for MCQ)
├── correctAnswer: String
├── explanation: String
├── topic: String (indexed)
├── createdAt

Attempts
├── _id
├── userId (indexed, ref: Users)
├── questionId (ref: Questions)
├── sessionId: String (groups attempts in one session)
├── userAnswer: String
├── isCorrect: Boolean
├── score: "correct" | "partial" | "incorrect"
├── feedback: String (AI-generated for short answer)
├── answeredAt: Date (indexed)

WeakTopics
├── _id
├── userId (indexed, ref: Users)
├── topic: String
├── mistakeCount: Number
├── totalAttempts: Number
├── accuracy: Number (computed: 1 - mistakes/total)
├── lastAttemptDate: Date
├── (compound index: userId + topic, unique)

Bookmarks
├── _id
├── userId (indexed, ref: Users)
├── questionId (ref: Questions)
├── note: String (optional user note)
├── createdAt

Notes
├── _id
├── userId (indexed, ref: Users)
├── title: String
├── content: String
├── materialId: (optional ref: Materials)
├── createdAt, updatedAt
```

## API Layer Structure

### Route Groups

| Prefix | Endpoints | Auth | Description |
|--------|-----------|------|-------------|
| `/api/auth` | POST /register, POST /login | No | User registration and login |
| `/api/users` | GET /me, PATCH /me, PATCH /me/level | Yes | Profile and settings |
| `/api/materials` | POST /upload, GET /, GET /:id, DELETE /:id, POST /:id/generate | Yes | Upload and manage study materials |
| `/api/questions` | GET /?materialId&topic, GET /:id, DELETE /:id | Yes | Query generated questions |
| `/api/practice` | GET /session, POST /answer | Yes | Practice session management |
| `/api/analytics` | GET /summary, GET /weak-topics, GET /history, GET /streaks | Yes | Dashboard and progress data |
| `/api/ai` | POST /summarize, POST /chat, POST /explain | Yes | Direct AI tutor interactions |
| `/api/bookmarks` | POST /, GET /, DELETE /:id | Yes | Bookmark questions |
| `/api/notes` | POST /, GET /, PATCH /:id, DELETE /:id | Yes | User notes |

### Response Format Convention

```javascript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

## AI Service Integration Patterns

### Model Selection Strategy

| Feature | Recommended Model | Rationale |
|---------|-------------------|-----------|
| Question Generation | gpt-4o-mini | Good at structured output, cost-effective for bulk generation |
| Answer Evaluation (short answer) | gpt-4o-mini | Semantic comparison is well within capability |
| Topic Detection | gpt-4o-mini | Simple extraction task |
| Material Summarization | gpt-4o-mini | Summarization is a core strength |
| Chat Tutoring | gpt-4o-mini (or gpt-4o for complex) | Conversational, may need more reasoning for complex topics |

**Cost strategy:** Start with gpt-4o-mini everywhere. It handles all these tasks well. Only escalate to gpt-4o if users report quality issues with specific features (likely chat tutoring for advanced topics).

### Prompt Engineering Principles

1. **Structured JSON output:** Always request JSON responses for question generation and topic detection. Use `response_format: { type: "json_object" }` when available.
2. **System prompts per feature:** Each AI service file has its own system prompt tailored to its task. Question generator has educator persona. Answer evaluator has grader persona.
3. **Text chunking:** For long PDFs (> ~6000 tokens of source text), chunk the text and generate questions per chunk, then deduplicate.
4. **Token budget awareness:** Estimate input tokens before sending. If source text is too long, summarize first, then generate questions from the summary.

### Error Handling for AI Calls

```
AI Call
  ├── Success → Parse response → Validate structure → Return
  ├── Rate Limited (429) → Exponential backoff retry (max 3)
  ├── Token Limit Exceeded → Chunk input, retry with smaller pieces
  ├── Invalid JSON Response → Retry with stricter prompt (max 2)
  ├── API Down (500/503) → Return cached questions or graceful error
  └── Unexpected → Log, return user-friendly error message
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single Express server, single MongoDB instance. No caching needed. |
| 1k-10k users | Add Redis for session caching and rate limiting. Cache analytics aggregations. Consider a background job queue (Bull) for question generation to avoid blocking requests. |
| 10k-100k users | OpenAI API costs become the primary concern. Implement per-user daily generation limits. Cache AI responses for identical/similar texts. Consider generating question pools in batch (background) rather than on-demand. |

### Scaling Priorities

1. **First bottleneck: OpenAI API latency and cost.** Question generation takes 5-15 seconds. Users will notice. Mitigation: generate in background, show progress, notify when ready. Cache questions aggressively — same material shouldn't re-generate.
2. **Second bottleneck: MongoDB read performance for analytics.** Aggregation queries over Attempts become slow at scale. Mitigation: pre-compute daily/weekly summaries into a separate `AnalyticsSummary` collection via a nightly job or on-write incremental updates.

## Anti-Patterns

### Anti-Pattern 1: Synchronous AI Generation in Request Cycle

**What people do:** User clicks "Generate Questions" → API blocks for 10-20 seconds waiting for OpenAI → returns all questions in one response.
**Why it's wrong:** 10-20 second API responses feel broken. Users double-click, refresh, open tickets. Express request timeouts may kill the process.
**Do this instead:** Return immediately with a `materialId` and `status: "generating"`. Poll for completion, or use Server-Sent Events. For v1 without WebSockets, a simple polling approach works fine: frontend polls `GET /materials/:id/status` every 2 seconds until `status: "ready"`. Alternatively, for v1 simplicity, a loading spinner with the synchronous approach is acceptable if generation stays under 10 seconds — just ensure the client has a long enough timeout.

### Anti-Pattern 2: Storing AI Prompts Inline in Route Handlers

**What people do:** Build OpenAI prompt strings directly inside Express route handlers.
**Why it's wrong:** Prompts are the most-iterated part of the system. Mixing them with HTTP handling logic makes them hard to find, test, and version.
**Do this instead:** Each AI capability gets its own service file with prompt templates as constants or template functions at the top. Route → Service → AI Service → OpenAI Client. Four layers, but each is dead simple.

### Anti-Pattern 3: Not Validating AI Output

**What people do:** Trust that OpenAI always returns valid JSON with all required fields.
**Why it's wrong:** LLMs hallucinate structure. Sometimes you get markdown instead of JSON. Sometimes fields are missing. Sometimes you get 3 questions when you asked for 10.
**Do this instead:** Always parse and validate AI responses. Use `JSON.parse()` in a try-catch. Validate that required fields exist. If validation fails, retry with a stricter prompt (once). If retry fails, return a clear error — don't save garbage to the database.

### Anti-Pattern 4: Single Massive Collection for Everything

**What people do:** Store questions, attempts, and weak topic data all as nested arrays inside the User document.
**Why it's wrong:** MongoDB documents have a 16MB limit. Deeply nested arrays are hard to query and index. Updating a single attempt means rewriting the entire user document.
**Do this instead:** Separate collections with references (userId). This is why the schema above has Users, Materials, Questions, Attempts, and WeakTopics as distinct collections. Use MongoDB's `$lookup` or application-level joins when you need related data.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | Server-side only via SDK (`openai` npm package) | NEVER expose API key to frontend. All AI calls go through backend. |
| MongoDB Atlas | Mongoose ODM via connection string | Use connection pooling. Set `useNewUrlParser` and `useUnifiedTopology`. |
| PDF Processing | `pdf-parse` npm package (server-side) | Runs in-process. For very large PDFs, consider a memory limit. Max file size: ~20MB recommended. |
| File Upload | Multer middleware (memory storage) | Don't write to disk on serverless. Buffer in memory → extract text → discard PDF binary (only store extracted text in DB to save storage). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | REST API over HTTPS | JWT in Authorization header. CORS configured for frontend origin only. |
| Route ↔ Service | Direct function call | Routes import services. Services never import routes. |
| Service ↔ AI Service | Direct function call | AI services are just another service. Business services orchestrate AI + DB. |
| Service ↔ Database | Mongoose model methods | Services import models. Models never import services. |

## Build Order (Recommended Implementation Sequence)

The build order is driven by dependencies. Each phase builds on the previous one.

### Phase 1: Foundation (No AI needed)

```
1.1  Backend scaffold: Express app, env config, MongoDB connection, error handler
1.2  User model + Auth routes (register, login, JWT middleware)
1.3  Frontend scaffold: Vite + React, routing, dark theme, AuthContext
1.4  Auth pages (Login, Register) connected to backend
1.5  Protected route wrapper (redirect to login if no JWT)
```

**Milestone:** User can register, login, and see a protected dashboard shell.

### Phase 2: Material Upload Pipeline

```
2.1  Material model (Mongoose schema)
2.2  PDF upload route with Multer (accept file, return extracted text)
2.3  pdf-parse integration (extract text from PDF buffer)
2.4  OpenAI client setup (config, wrapper with retry logic)
2.5  Topic detection AI service (send text → get topics)
2.6  Upload flow frontend (dropzone → topic review → confirm)
```

**Milestone:** User uploads a PDF, sees extracted topics, can edit them.

### Phase 3: Question Generation

```
3.1  Question model (Mongoose schema)
3.2  Question generator AI service (prompts for MCQ, short answer, T/F)
3.3  Generate route: POST /materials/:id/generate
3.4  AI response validation and parsing
3.5  Frontend: generation trigger from upload flow, loading state
3.6  Questions list view (browse generated questions)
```

**Milestone:** User uploads PDF → reviews topics → generates questions → sees them.

### Phase 4: Practice Engine

```
4.1  Attempt model, WeakTopic model
4.2  Practice session service (build question queue, general vs drill modes)
4.3  Answer evaluation: direct comparison for MCQ/TF
4.4  Answer evaluation: AI service for short answer
4.5  Practice routes (GET /session, POST /answer)
4.6  Frontend: Practice page with question cards, answer input, feedback display
4.7  Weak topic tracking (update on each answer)
```

**Milestone:** Full study loop works — upload → generate → practice → get feedback.

### Phase 5: Analytics & Dashboard

```
5.1  Analytics service (aggregate attempts by topic, time, accuracy)
5.2  Analytics routes
5.3  Dashboard page (summary stats, streak, recent activity)
5.4  Analytics page (charts: accuracy over time, weak topics, question distribution)
5.5  Streak tracking logic (update on daily activity)
5.6  Daily goal tracking
```

**Milestone:** User sees their progress and knows what to study next.

### Phase 6: AI Tutor & Extras

```
6.1  Summarizer AI service (material summaries)
6.2  Chat tutor AI service (conversational Q&A about materials)
6.3  AI tutor UI (chat interface on dashboard or practice page)
6.4  Bookmarks (model, routes, UI)
6.5  Notes (model, routes, UI)
6.6  Pomodoro timer component
6.7  Theme toggle (dark/light)
```

**Milestone:** Full feature set complete.

### Phase 7: Polish & Deploy

```
7.1  Input validation across all routes (Joi/Zod)
7.2  Rate limiting (express-rate-limit)
7.3  Error handling audit
7.4  Loading states, empty states, error states in UI
7.5  Mobile responsive audit
7.6  Deploy: Vercel (frontend), Render/Railway (backend), MongoDB Atlas
7.7  Environment variable setup for production
```

### Dependency Graph

```
Phase 1 (Auth)
    ↓
Phase 2 (Upload) ← requires auth + OpenAI setup
    ↓
Phase 3 (Questions) ← requires materials + AI service
    ↓
Phase 4 (Practice) ← requires questions
    ↓
Phase 5 (Analytics) ← requires attempts data from practice
    ↓
Phase 6 (Tutor/Extras) ← can partially parallelize with Phase 5
    ↓
Phase 7 (Polish) ← after all features exist
```

## Sources

- OpenAI API documentation: structured outputs, chat completions, best practices for JSON mode
- MongoDB schema design patterns: separate collections with references vs. embedding (MongoDB docs recommend referencing for unbounded arrays)
- Express.js best practices: layered architecture (routes → services → models), centralized error handling
- Common patterns in ed-tech platforms (Quizlet architecture, Khan Academy's mastery-based learning model)
- JWT authentication patterns for SPAs: httpOnly cookies vs. localStorage trade-offs

---
*Architecture research for: AI-powered personalized study platform (StudyAI)*
*Researched: 2026-03-17*
