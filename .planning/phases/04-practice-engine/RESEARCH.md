---
phase: 04-practice-engine
type: research
requirements: [PRAC-01, PRAC-02, PRAC-03, PRAC-04, PRAC-05, PRAC-06, PRAC-07, PRAC-08]
depends-on: Phase 3 (Question Generation) - complete
created: 2026-03-18
---

# Phase 4 Research: Practice Engine

**Goal:** Build the practice session system where users answer questions, receive immediate feedback, and have their attempts stored for analytics. Supports general practice and weak-topic drill modes.

**Requirements covered:** PRAC-01 through PRAC-08

---

## 1. Attempt Model Schema Design

### 1.1 Attempt Schema - `server/src/models/Attempt.ts`

```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttempt extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  materialId: Types.ObjectId;
  sessionId: string;              // Groups attempts into sessions
  topic: string;                  // Denormalized for fast analytics
  questionType: "mcq" | "short_answer" | "true_false";
  difficulty: "easy" | "medium" | "hard";
  userAnswer: string;
  isCorrect: boolean;
  aiEvaluation?: {                // For short answer AI evaluation
    score: number;                // 0-100
    feedback: string;
    isCorrect: boolean;
  };
  timeSpentMs?: number;           // Time to answer (optional)
  createdAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "short_answer", "true_false"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    aiEvaluation: {
      score: Number,
      feedback: String,
      isCorrect: Boolean,
    },
    timeSpentMs: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, topic: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, isCorrect: 1 });
attemptSchema.index({ sessionId: 1, createdAt: 1 });

export const Attempt = mongoose.model<IAttempt>("Attempt", attemptSchema);
```

### 1.2 Schema Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate Attempt collection** | Enables efficient analytics queries. One attempt per question answered. |
| **Denormalized `topic` field** | Avoids joins for per-topic accuracy calculations. |
| **`sessionId` as string** | UUID for grouping attempts. No need for Session collection in v1. |
| **`aiEvaluation` subdocument** | Stores AI feedback for short answers only. |
| **`timeSpentMs` optional** | Nice-to-have metric, not required for core functionality. |

---

## 2. Practice Session Flow

### 2.1 Session Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    Start Practice Session                     │
│  User selects: material OR weak-topic mode                   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Load Questions for Session                       │
│  - General mode: random questions from material               │
│  - Weak-topic mode: questions from user's weak topics        │
│  - Generate sessionId (UUID)                                  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Display Question (one at a time)                 │
│  PRAC-02: Show question text, options (MCQ), input field      │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              User Submits Answer                              │
│  PRAC-03: Send answer to backend                              │
└─────────────────────────┬────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
┌───────────────────────┐  ┌───────────────────────────────────┐
│  MCQ / True-False     │  │  Short Answer                     │
│  PRAC-04: Exact match │  │  PRAC-05: AI semantic evaluation  │
└───────────────────────┘  └───────────────────────────────────┘
                │                   │
                └─────────┬─────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Show Feedback                                    │
│  PRAC-06: Correct/incorrect + explanation                     │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Store Attempt                                    │
│  PRAC-08: Save to database                                    │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Next Question or End Session                     │
│  User clicks "Next" or session ends                           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Session State Management

Session state is managed client-side (no PracticeSession collection needed):

```typescript
interface PracticeSessionState {
  sessionId: string;           // UUID
  mode: "general" | "weak_topic";
  materialId?: string;         // For general mode
  questions: Question[];       // Loaded questions
  currentIndex: number;        // Current question index
  attempts: AttemptResult[];   // Results so far
  startedAt: Date;
}

interface AttemptResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
}
```

---

## 3. Answer Evaluation

### 3.1 MCQ and True/False (PRAC-04)

Exact match comparison:

```typescript
function evaluateMcqOrTrueFalse(
  userAnswer: string,
  correctAnswer: string,
  questionType: "mcq" | "true_false"
): boolean {
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();
  
  if (questionType === "true_false") {
    // Normalize True/False variations
    const userBool = normalizedUser === "true" || normalizedUser === "t";
    const correctBool = normalizedCorrect === "true" || normalizedCorrect === "t";
    return userBool === correctBool;
  }
  
  // MCQ: exact text match
  return normalizedUser === normalizedCorrect;
}
```

### 3.2 Short Answer AI Evaluation (PRAC-05)

**Service file:** `server/src/services/ai/answer-evaluator.ts`

```typescript
const ANSWER_EVALUATOR_SYSTEM_PROMPT = `You are an educational assessment AI. Evaluate student answers against the correct answer.

Your task:
1. Compare the student's answer to the correct answer semantically (not just string matching)
2. Determine if the student's answer is essentially correct, even if worded differently
3. Provide a score from 0-100:
   - 80-100: Correct (captures the key concept)
   - 50-79: Partially correct (some understanding, missing key points)
   - 0-49: Incorrect
4. Provide brief feedback explaining why

OUTPUT FORMAT (JSON):
{
  "score": <number 0-100>,
  "isCorrect": <boolean - true if score >= 80>,
  "feedback": "<brief explanation>"
}`;

function buildEvaluationPrompt(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}): string {
  return `Question: ${params.question}

Correct Answer: ${params.correctAnswer}

Explanation: ${params.explanation}

Student's Answer: ${params.userAnswer}

Evaluate the student's answer. Is it essentially correct?`;
}
```

### 3.3 Evaluation Response Schema

```typescript
const evaluationResponseSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string().min(1).max(500),
});
```

---

## 4. Practice Modes (PRAC-07)

### 4.1 General Mode

- User selects a material
- System fetches random questions from that material
- Questions shuffled for variety

```typescript
async function getQuestionsForGeneralMode(
  materialId: string,
  userId: string,
  limit: number = 10
): Promise<Question[]> {
  return Question.aggregate([
    { $match: { materialId: new ObjectId(materialId), userId: new ObjectId(userId) } },
    { $sample: { size: limit } },
  ]);
}
```

### 4.2 Weak-Topic Drill Mode

- System identifies user's weak topics (from Phase 5, but we can stub)
- Fetches questions specifically from weak topics
- For now, can select topics with lowest accuracy from past attempts

```typescript
async function getQuestionsForWeakTopicMode(
  userId: string,
  limit: number = 10
): Promise<Question[]> {
  // Get weak topics (simplified: topics with < 70% accuracy)
  const weakTopics = await getWeakTopics(userId);
  
  if (weakTopics.length === 0) {
    throw new AppError("No weak topics found", 400, "NO_WEAK_TOPICS");
  }
  
  return Question.aggregate([
    { $match: { userId: new ObjectId(userId), topic: { $in: weakTopics } } },
    { $sample: { size: limit } },
  ]);
}

async function getWeakTopics(userId: string): Promise<string[]> {
  const pipeline = [
    { $match: { userId: new ObjectId(userId) } },
    { $group: {
        _id: "$topic",
        total: { $sum: 1 },
        correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
      }
    },
    { $project: {
        topic: "$_id",
        accuracy: { $divide: ["$correct", "$total"] },
      }
    },
    { $match: { accuracy: { $lt: 0.7 } } },
    { $sort: { accuracy: 1 } },
    { $limit: 5 },
  ];
  
  const results = await Attempt.aggregate(pipeline);
  return results.map(r => r.topic);
}
```

---

## 5. API Endpoint Design

### 5.1 Route File: `server/src/routes/practice.routes.ts`

| Method | Path | Body / Params | Description | Req |
|--------|------|---------------|-------------|-----|
| `POST` | `/api/practice/start` | `{ mode, materialId?, questionCount? }` | Start practice session | PRAC-01, PRAC-07 |
| `POST` | `/api/practice/submit` | `{ sessionId, questionId, answer, timeSpentMs? }` | Submit answer | PRAC-03, PRAC-04, PRAC-05 |
| `GET` | `/api/practice/session/:sessionId` | - | Get session results | - |

### 5.2 Start Session Endpoint

**POST `/api/practice/start`**

Request:
```json
{
  "mode": "general",       // "general" | "weak_topic"
  "materialId": "65f...",  // Required for general mode
  "questionCount": 10      // Optional, default 10
}
```

Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "mode": "general",
    "questions": [
      {
        "id": "65f...",
        "type": "mcq",
        "difficulty": "medium",
        "text": "What is...?",
        "options": ["A", "B", "C", "D"],
        "topic": "Topic Name"
      }
    ],
    "totalQuestions": 10
  }
}
```

Note: Questions returned WITHOUT correctAnswer/explanation. Those are revealed after submission.

### 5.3 Submit Answer Endpoint

**POST `/api/practice/submit`**

Request:
```json
{
  "sessionId": "uuid-here",
  "questionId": "65f...",
  "answer": "Option A",
  "timeSpentMs": 15000
}
```

Response:
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "correctAnswer": "Option B",
    "explanation": "Because...",
    "aiEvaluation": null,  // Only for short_answer
    "attemptId": "65f..."
  }
}
```

For short answers:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "The mitochondria...",
    "explanation": "Because...",
    "aiEvaluation": {
      "score": 85,
      "feedback": "Good understanding of the concept",
      "isCorrect": true
    },
    "attemptId": "65f..."
  }
}
```

---

## 6. Frontend Component Structure

### 6.1 Component Hierarchy

```
client/src/
├── api/
│   └── practice.ts                    # Practice API functions
├── hooks/
│   └── use-practice.ts                # Practice hooks
├── stores/
│   └── practice-store.ts              # Zustand store for session state
├── components/
│   └── practice/
│       ├── PracticeSetup.tsx          # Mode/material selection
│       ├── QuestionDisplay.tsx        # Single question view
│       ├── McqOptions.tsx             # MCQ option buttons
│       ├── ShortAnswerInput.tsx       # Text input for short answer
│       ├── TrueFalseButtons.tsx       # True/False buttons
│       ├── FeedbackDisplay.tsx        # Correct/incorrect feedback
│       ├── SessionProgress.tsx        # Progress bar
│       └── SessionResults.tsx         # End-of-session summary
├── pages/
│   └── PracticePage.tsx               # Main practice page (replaces placeholder)
```

### 6.2 Practice Store (Zustand)

```typescript
interface PracticeStore {
  // Session state
  sessionId: string | null;
  mode: "general" | "weak_topic" | null;
  questions: Question[];
  currentIndex: number;
  attempts: AttemptResult[];
  
  // Actions
  startSession: (sessionId: string, mode: string, questions: Question[]) => void;
  submitAttempt: (result: AttemptResult) => void;
  nextQuestion: () => void;
  endSession: () => void;
  reset: () => void;
  
  // Computed
  currentQuestion: () => Question | null;
  isComplete: () => boolean;
  score: () => { correct: number; total: number; percentage: number };
}
```

### 6.3 Client Types

```typescript
// Add to client/src/types/index.ts

export interface PracticeSession {
  sessionId: string;
  mode: "general" | "weak_topic";
  questions: Question[];
  totalQuestions: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  timeSpentMs?: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
    isCorrect: boolean;
  };
  attemptId: string;
}

export interface AttemptResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}
```

---

## 7. Feedback Display (PRAC-06)

### 7.1 Visual Feedback

```tsx
// FeedbackDisplay.tsx
interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  userAnswer: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

// Visual design:
// - Green background + checkmark for correct
// - Red background + X for incorrect
// - Show correct answer if wrong
// - Show explanation always
// - For short answer: show AI score and feedback
```

### 7.2 UIUX-05 Compliance

The feedback must be:
- Visually clear (green/red colors)
- Include the explanation
- Show what the correct answer was (if incorrect)
- For short answers, show AI evaluation score

---

## 8. Integration Points

### 8.1 Question Model

Practice uses questions from Phase 3. Need to fetch with:
- userId scope (security)
- materialId filter (general mode)
- topic filter (weak-topic mode)
- Random sampling for variety

### 8.2 Rate Limiting

Apply `aiLimiter` to submit endpoint (for short answer evaluation):

```typescript
router.post("/submit", aiLimiter, validate(submitAnswerSchema), handler);
```

### 8.3 Future Integration (Phase 5)

Attempts stored here will power:
- ADPT-01: Track incorrect answers per topic
- ADPT-02: Weak topic list calculation
- ANLT-01-07: Analytics dashboard

---

## 9. File Inventory

### New Server Files

| File | Purpose |
|------|---------|
| `server/src/models/Attempt.ts` | Mongoose Attempt model |
| `server/src/routes/practice.routes.ts` | Practice REST endpoints |
| `server/src/services/practice.service.ts` | Practice business logic |
| `server/src/services/ai/answer-evaluator.ts` | Short answer AI evaluation |
| `server/src/schemas/practice.schemas.ts` | Zod validation schemas |

### Modified Server Files

| File | Changes |
|------|---------|
| `server/src/app.ts` | Register practice routes |

### New Client Files

| File | Purpose |
|------|---------|
| `client/src/api/practice.ts` | Practice API functions |
| `client/src/hooks/use-practice.ts` | Practice hooks |
| `client/src/stores/practice-store.ts` | Zustand store |
| `client/src/components/practice/PracticeSetup.tsx` | Setup UI |
| `client/src/components/practice/QuestionDisplay.tsx` | Question view |
| `client/src/components/practice/McqOptions.tsx` | MCQ options |
| `client/src/components/practice/ShortAnswerInput.tsx` | Short answer input |
| `client/src/components/practice/TrueFalseButtons.tsx` | T/F buttons |
| `client/src/components/practice/FeedbackDisplay.tsx` | Feedback UI |
| `client/src/components/practice/SessionProgress.tsx` | Progress bar |
| `client/src/components/practice/SessionResults.tsx` | Results summary |

### Modified Client Files

| File | Changes |
|------|---------|
| `client/src/types/index.ts` | Add practice types |
| `client/src/App.tsx` | Update practice route |

---

## 10. Recommended Plan Structure

### Plan 04-01: Backend Practice Engine
- Create Attempt model
- Create answer-evaluator AI service
- Create practice service (start session, submit, evaluate)
- Create practice routes
- Create validation schemas

### Plan 04-02: Frontend Practice UI
- Add practice types
- Create practice API functions and hooks
- Create Zustand practice store
- Create all practice components
- Update PracticePage
- Wire up routes

---

## 11. Validation Checklist

| Req | Description | Validation Method |
|-----|-------------|-------------------|
| PRAC-01 | Start practice from materials | Test start session endpoint |
| PRAC-02 | Questions displayed one at a time | UI shows single question |
| PRAC-03 | Submit answer for each question | Submit endpoint works |
| PRAC-04 | MCQ/T-F exact match | Unit test evaluation logic |
| PRAC-05 | Short answer AI evaluation | Test with AI, check scores |
| PRAC-06 | Immediate feedback | UI shows correct/incorrect + explanation |
| PRAC-07 | General and weak-topic modes | Both modes return questions |
| PRAC-08 | Attempts stored in DB | Check Attempt collection after submit |

---

*Research completed: 2026-03-18*
*Ready for planning phase.*
