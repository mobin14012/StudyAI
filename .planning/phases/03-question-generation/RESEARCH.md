---
phase: 03-question-generation
type: research
requirements: [QGEN-01, QGEN-02, QGEN-03, QGEN-04, QGEN-05, QGEN-06, QGEN-07, QGEN-08]
depends-on: Phase 2 (Upload Pipeline) - complete
created: 2026-03-18
---

# Phase 3 Research: Question Generation

**Goal:** Generate diverse, high-quality study questions (MCQ, short answer, true/false) from uploaded materials, with difficulty levels, caching, batch generation, and validation.

**Requirements covered:** QGEN-01 through QGEN-08

---

## 1. Question Model Schema Design

### 1.1 Question Schema - `server/src/models/Question.ts`

```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export type QuestionType = "mcq" | "short_answer" | "true_false";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface IQuestion extends Document {
  userId: Types.ObjectId;
  materialId: Types.ObjectId;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];           // For MCQ only (4 options)
  correctAnswer: string;
  explanation: string;
  topic: string;                // Topic tag from material's topics
  sourceExcerpt?: string;       // Text excerpt this question is grounded in (for validation)
  cacheKey: string;             // For cache lookup: hash of materialId + topic + difficulty + type
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["mcq", "short_answer", "true_false"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    options: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          // Options required only for MCQ, must have exactly 4
          if (this.type === "mcq") {
            return v && v.length === 4;
          }
          return true;
        },
        message: "MCQ questions must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    sourceExcerpt: {
      type: String,
      maxlength: 2000,
    },
    cacheKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
questionSchema.index({ userId: 1, materialId: 1, createdAt: -1 });
questionSchema.index({ userId: 1, topic: 1 });
questionSchema.index({ cacheKey: 1 }); // For cache lookup
questionSchema.index({ materialId: 1, topic: 1, difficulty: 1, type: 1 }); // For cache checks

export const Question = mongoose.model<IQuestion>("Question", questionSchema);
```

### 1.2 Schema Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate Question collection** | Questions grow unboundedly; embedding in Material would hit 16MB limit. Also enables efficient queries for practice sessions. |
| **Single `correctAnswer` field** | Works for all question types. For MCQ, stores the answer text (not index). For T/F, stores "True" or "False". For short answer, stores expected answer. |
| **`sourceExcerpt` field** | Stores the material excerpt this question was derived from. Enables validation that question is grounded in source (QGEN-05). |
| **`cacheKey` field** | Pre-computed hash for cache lookups (QGEN-06). Generated from `materialId + topic + difficulty + type`. |
| **`topic` as string** | Matches topic names from Material.topics[].name. Simple string equality for matching. |
| **Options array for MCQ only** | Validated at schema level. T/F and short answer don't need options. |

### 1.3 Index Strategy

| Index | Purpose |
|-------|---------|
| `{ userId: 1, materialId: 1, createdAt: -1 }` | List questions for a material, sorted by newest |
| `{ userId: 1, topic: 1 }` | Filter questions by topic (for practice sessions in Phase 4) |
| `{ cacheKey: 1 }` | Fast cache lookup |
| `{ materialId: 1, topic: 1, difficulty: 1, type: 1 }` | Cache existence check before generation |

### 1.4 Cache Key Generation

```typescript
import crypto from "crypto";

export function generateCacheKey(
  materialId: string,
  topic: string,
  difficulty: DifficultyLevel,
  type: QuestionType
): string {
  const input = `${materialId}:${topic.toLowerCase()}:${difficulty}:${type}`;
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}
```

The cache key is a 32-character hash uniquely identifying a (material, topic, difficulty, type) combination.

---

## 2. AI Prompt Engineering Strategy

### 2.1 Grounding Strategy (QGEN-05 - No Hallucination)

**Problem:** LLMs can generate questions based on general knowledge, not the source material.

**Solution: Source-Grounded Generation**

1. **Include source text in prompt** - Always provide relevant material text.
2. **Request source excerpts** - Ask AI to cite the specific excerpt each question is based on.
3. **Validate citations** - Post-generation, verify that cited excerpts exist in the source text.
4. **Strict system prompt** - Instruct AI to ONLY use information from the provided text.

### 2.2 Question Generator AI Service

**Service file:** `server/src/services/ai/question-generator.ts`

**System Prompt (grounded, structured output):**

```typescript
const QUESTION_GENERATOR_SYSTEM_PROMPT = `You are an expert educational content creator. Generate study questions from the provided source material.

CRITICAL RULES:
1. ONLY generate questions that can be answered using information explicitly stated in the source material.
2. DO NOT use outside knowledge. If information isn't in the source, don't ask about it.
3. For each question, include the exact excerpt from the source that contains the answer.
4. Generate questions that test understanding, not just memorization.
5. Ensure questions are clear, unambiguous, and grammatically correct.
6. For MCQ: provide exactly 4 options with only one correct answer. Incorrect options should be plausible but clearly wrong based on the source.
7. For true/false: the statement must be definitively true or false based on the source.
8. For short answer: the answer should be 1-3 sentences maximum.

OUTPUT FORMAT:
Return a JSON object with a "questions" array. Each question object must have:
- type: "mcq" | "short_answer" | "true_false"
- difficulty: "easy" | "medium" | "hard"
- text: the question text
- options: array of 4 strings (only for MCQ, omit for other types)
- correctAnswer: the correct answer text
- explanation: why this is the correct answer (1-2 sentences)
- topic: the topic this question belongs to
- sourceExcerpt: the exact quote from the source material (max 200 chars)`;
```

### 2.3 User Prompt Template

```typescript
function buildUserPrompt(params: {
  sourceText: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  count: number;
}): string {
  const typeDescription = params.questionTypes.join(", ");
  
  return `Generate ${params.count} study questions about "${params.topic}" from the following source material.

REQUIREMENTS:
- Difficulty level: ${params.difficulty}
- Question types to generate: ${typeDescription}
- All questions must be answerable from the source text below
- Include source excerpts to prove grounding

SOURCE MATERIAL:
---
${params.sourceText}
---

Generate exactly ${params.count} questions as a JSON object:
{"questions": [...]}`;
}
```

### 2.4 Difficulty Level Guidelines

Include in system prompt based on difficulty:

```typescript
const DIFFICULTY_GUIDELINES = {
  easy: `
EASY difficulty means:
- Questions about explicitly stated facts
- Direct recall from the text
- Simple definitions and basic concepts
- "What is..." or "Name the..." style questions`,
  
  medium: `
MEDIUM difficulty means:
- Questions requiring connection between multiple facts
- Application of concepts to examples
- "Why does..." or "How does..." style questions
- Comparisons and relationships`,
  
  hard: `
HARD difficulty means:
- Questions requiring analysis and synthesis
- Inference from multiple parts of the text
- "What would happen if..." or "Evaluate..." style questions
- Critical thinking and deeper understanding`,
};
```

### 2.5 Response Schema Validation

```typescript
import { z } from "zod";

const questionResponseSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["mcq", "short_answer", "true_false"]),
      difficulty: z.enum(["easy", "medium", "hard"]),
      text: z.string().min(10).max(2000),
      options: z.array(z.string().min(1).max(500)).length(4).optional(),
      correctAnswer: z.string().min(1).max(1000),
      explanation: z.string().min(10).max(2000),
      topic: z.string().min(1).max(100),
      sourceExcerpt: z.string().min(10).max(500),
    })
  ).min(1).max(20),
});

// Additional validation for MCQ options
function validateQuestion(question: any): boolean {
  if (question.type === "mcq") {
    if (!question.options || question.options.length !== 4) {
      return false;
    }
    // Correct answer must be one of the options
    if (!question.options.includes(question.correctAnswer)) {
      return false;
    }
  }
  if (question.type === "true_false") {
    if (!["True", "False", "true", "false"].includes(question.correctAnswer)) {
      return false;
    }
  }
  return true;
}
```

### 2.6 API Call Parameters

```typescript
const response = await chatCompletion({
  systemPrompt: QUESTION_GENERATOR_SYSTEM_PROMPT + DIFFICULTY_GUIDELINES[difficulty],
  userPrompt: buildUserPrompt({
    sourceText: truncatedText,
    topic,
    difficulty,
    questionTypes,
    count,
  }),
  maxTokens: 4000,       // Questions are verbose
  temperature: 0.7,      // Some creativity for variety
  jsonMode: true,
});
```

### 2.7 Source Excerpt Validation

Post-generation validation to ensure grounding:

```typescript
function validateSourceGrounding(
  question: GeneratedQuestion,
  sourceText: string
): boolean {
  if (!question.sourceExcerpt) return false;
  
  // Normalize both strings for comparison
  const normalizedExcerpt = question.sourceExcerpt.toLowerCase().trim();
  const normalizedSource = sourceText.toLowerCase();
  
  // Check if excerpt exists in source (fuzzy match for minor variations)
  // Use substring matching with some tolerance
  const excerptWords = normalizedExcerpt.split(/\s+/).filter(w => w.length > 3);
  const matchedWords = excerptWords.filter(word => normalizedSource.includes(word));
  
  // Require at least 80% of significant words to match
  return matchedWords.length >= excerptWords.length * 0.8;
}
```

---

## 3. Caching Strategy (QGEN-06)

### 3.1 Cache Key Design

The cache key ensures that identical generation requests return cached results:

```
Cache Key = hash(materialId + topic + difficulty + type)
```

**Why this combination:**
- `materialId`: Different materials have different content
- `topic`: Same material can have multiple topics
- `difficulty`: Same topic can be asked at different levels
- `type`: MCQ vs short answer vs true/false are distinct

### 3.2 Cache Lookup Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Question Generation Request                │
│    (materialId, topic, difficulty, types[], count)           │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Generate cache keys for each type                │
│   For each type in types[]:                                   │
│     cacheKey = hash(materialId + topic + difficulty + type)   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Check for existing cached questions              │
│   Query: Question.find({ cacheKey: { $in: cacheKeys } })      │
└─────────────────────────┬────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────────────┐
│  Cached questions    │   │  Missing questions need         │
│  found for some      │   │  generation                     │
│  types               │   │                                 │
└─────────────────────┘   └─────────────────────────────────┘
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Generate only missing question types             │
│   - If MCQ cached but short_answer missing, only generate SA │
│   - New questions get same cacheKey for future lookups        │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Return combined cached + new questions           │
│   - Response includes { cached: true/false } per question     │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Cache Implementation

```typescript
interface GenerateQuestionsParams {
  materialId: string;
  topic: string;
  difficulty: DifficultyLevel;
  types: QuestionType[];
  count: number;
  userId: string;
}

async function generateOrGetCachedQuestions(
  params: GenerateQuestionsParams
): Promise<{ questions: IQuestion[]; fromCache: boolean }> {
  const { materialId, topic, difficulty, types, count, userId } = params;
  
  // Generate cache keys for each requested type
  const cacheKeys = types.map(type => 
    generateCacheKey(materialId, topic, difficulty, type)
  );
  
  // Check for existing cached questions
  const cachedQuestions = await Question.find({
    cacheKey: { $in: cacheKeys },
    userId,
  });
  
  // Determine which types need generation
  const cachedTypes = new Set(cachedQuestions.map(q => q.type));
  const missingTypes = types.filter(t => !cachedTypes.has(t));
  
  if (missingTypes.length === 0) {
    // All requested types are cached
    return { questions: cachedQuestions.slice(0, count), fromCache: true };
  }
  
  // Generate missing types
  const newQuestions = await generateNewQuestions({
    materialId,
    topic,
    difficulty,
    types: missingTypes,
    count: count - cachedQuestions.length,
    userId,
  });
  
  // Combine and return
  const allQuestions = [...cachedQuestions, ...newQuestions];
  return { questions: allQuestions.slice(0, count), fromCache: false };
}
```

### 3.4 Cache Invalidation

**When to invalidate:**
1. Material is deleted → cascade delete all questions for that material
2. Material content is updated → invalidate cache (not planned for v1, materials are immutable after upload)

**Implementation:**

```typescript
// In material.service.ts deleteMaterial function:
async function deleteMaterial(materialId: string, userId: string): Promise<void> {
  // Delete material
  await Material.findOneAndDelete({ _id: materialId, userId });
  
  // Cascade delete all questions for this material
  await Question.deleteMany({ materialId, userId });
}
```

---

## 4. API Endpoint Design

### 4.1 Route File: `server/src/routes/question.routes.ts`

All routes protected by `authenticate` middleware.

| Method | Path | Body / Params | Description | Req |
|--------|------|---------------|-------------|-----|
| `POST` | `/api/questions/generate` | `{ materialId, topic, difficulty?, types[], count? }` | Generate questions for a topic | QGEN-01, QGEN-02, QGEN-03, QGEN-07 |
| `GET` | `/api/questions` | Query: `?materialId=&topic=&difficulty=&type=&page=&limit=` | List questions with filters | - |
| `GET` | `/api/questions/:id` | - | Get single question (without answer for practice) | - |
| `GET` | `/api/questions/:id/full` | - | Get question with answer (for review) | - |
| `DELETE` | `/api/questions/:id` | - | Delete a single question | - |
| `DELETE` | `/api/questions/batch` | `{ ids: string[] }` | Delete multiple questions | - |

### 4.2 Generate Endpoint Specification

#### POST `/api/questions/generate`

**Middleware chain:** `authenticate` -> `aiLimiter` -> `validate(generateQuestionsSchema)` -> handler

**Request body:**

```json
{
  "materialId": "65f...",
  "topic": "Photosynthesis",
  "difficulty": "medium",
  "types": ["mcq", "short_answer"],
  "count": 5
}
```

**Validation schema:**

```typescript
const generateQuestionsSchema = z.object({
  materialId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
  topic: z.string().min(1).max(100),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  types: z.array(z.enum(["mcq", "short_answer", "true_false"]))
    .min(1)
    .max(3)
    .default(["mcq"]),
  count: z.number().int().min(1).max(10).default(5),
});
```

**Processing flow:**

1. Validate request body
2. Fetch material by ID (verify ownership)
3. Verify requested topic exists in material.topics
4. Determine default difficulty based on user level (QGEN-04)
5. Check cache for existing questions
6. Generate missing questions via AI
7. Validate generated questions (QGEN-08)
8. Save valid questions to database
9. Return questions

**Default difficulty mapping (QGEN-04):**

```typescript
function getDefaultDifficulty(userLevel: "junior" | "senior"): DifficultyLevel {
  return userLevel === "junior" ? "easy" : "medium";
}
```

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "65f...",
        "type": "mcq",
        "difficulty": "medium",
        "text": "What is the primary function of chlorophyll in photosynthesis?",
        "options": [
          "To absorb light energy",
          "To store glucose",
          "To release oxygen",
          "To transport water"
        ],
        "topic": "Photosynthesis",
        "createdAt": "2026-03-18T..."
      }
    ],
    "generated": 3,
    "cached": 2,
    "totalReturned": 5
  }
}
```

**Note:** Response does NOT include `correctAnswer` or `explanation` - these are revealed during practice/review.

**Error responses:**

| Scenario | Status | Code | Message |
|----------|--------|------|---------|
| Material not found | 404 | `MATERIAL_NOT_FOUND` | "Material not found" |
| Topic not in material | 400 | `INVALID_TOPIC` | "Topic 'X' not found in this material" |
| Material not ready | 400 | `MATERIAL_NOT_READY` | "Material is still processing" |
| AI generation failed | 500 | `GENERATION_FAILED` | "Unable to generate questions. Please try again" |
| Rate limit exceeded | 429 | `AI_RATE_LIMIT` | "AI request limit exceeded" |

### 4.3 List Questions Endpoint

#### GET `/api/questions`

**Query parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `materialId` | string | No | - | Filter by material |
| `topic` | string | No | - | Filter by topic |
| `difficulty` | string | No | - | Filter by difficulty |
| `type` | string | No | - | Filter by question type |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max 50) |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "65f...",
      "type": "mcq",
      "difficulty": "medium",
      "text": "What is the primary function...",
      "topic": "Photosynthesis",
      "materialId": "65f...",
      "createdAt": "2026-03-18T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 4.4 Request Validation Schemas

**File:** `server/src/schemas/question.schemas.ts`

```typescript
import { z } from "zod";

export const generateQuestionsSchema = z.object({
  materialId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
  topic: z.string().min(1, "Topic required").max(100),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  types: z.array(z.enum(["mcq", "short_answer", "true_false"]))
    .min(1, "At least one question type required")
    .max(3)
    .default(["mcq"]),
  count: z.number().int().min(1).max(10).default(5),
});

export const questionListQuerySchema = z.object({
  materialId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  topic: z.string().max(100).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  type: z.enum(["mcq", "short_answer", "true_false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const questionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID"),
});

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1, "At least one ID required")
    .max(50, "Maximum 50 IDs per batch"),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
```

---

## 5. Frontend Component Structure

### 5.1 Component Hierarchy

```
client/src/
├── api/
│   └── questions.ts                  # Question API functions
├── hooks/
│   └── use-questions.ts              # TanStack Query hooks
├── types/
│   └── index.ts                      # Add Question types
├── components/
│   └── questions/
│       ├── GenerateQuestionsForm.tsx  # Topic + difficulty + types selection
│       ├── QuestionTypeSelector.tsx   # MCQ/short answer/T-F checkboxes
│       ├── DifficultySelector.tsx     # Easy/medium/hard selector
│       ├── GenerationProgress.tsx     # Progress during generation
│       ├── QuestionCard.tsx           # Display a single question
│       ├── QuestionList.tsx           # List of generated questions
│       ├── QuestionPreview.tsx        # Question preview without answer
│       └── QuestionFilters.tsx        # Filter controls for question list
├── pages/
│   ├── GenerateQuestionsPage.tsx     # Main generation flow
│   └── QuestionsPage.tsx             # Browse all questions
```

### 5.2 Client Types

**Additions to `client/src/types/index.ts`:**

```typescript
// Question types
export type QuestionType = "mcq" | "short_answer" | "true_false";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];  // MCQ only
  topic: string;
  materialId: string;
  createdAt: string;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: string;
  explanation: string;
}

export interface GenerateQuestionsRequest {
  materialId: string;
  topic: string;
  difficulty?: DifficultyLevel;
  types: QuestionType[];
  count?: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  generated: number;
  cached: number;
  totalReturned: number;
}

export interface QuestionListResponse {
  data: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 5.3 API Layer

**File:** `client/src/api/questions.ts`

```typescript
import api from "./client";
import type {
  Question,
  QuestionWithAnswer,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  QuestionListResponse,
} from "@/types";

export async function generateQuestionsApi(
  params: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const response = await api.post("/questions/generate", params, {
    timeout: 60000, // 60s timeout for AI generation
  });
  return response.data.data;
}

export async function getQuestionsApi(params: {
  materialId?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<QuestionListResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  const response = await api.get(`/questions?${queryParams.toString()}`);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function getQuestionApi(id: string): Promise<Question> {
  const response = await api.get(`/questions/${id}`);
  return response.data.data;
}

export async function getQuestionWithAnswerApi(id: string): Promise<QuestionWithAnswer> {
  const response = await api.get(`/questions/${id}/full`);
  return response.data.data;
}

export async function deleteQuestionApi(id: string): Promise<void> {
  await api.delete(`/questions/${id}`);
}

export async function deleteQuestionsBatchApi(ids: string[]): Promise<void> {
  await api.delete("/questions/batch", { data: { ids } });
}
```

### 5.4 TanStack Query Hooks

**File:** `client/src/hooks/use-questions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateQuestionsApi,
  getQuestionsApi,
  getQuestionApi,
  getQuestionWithAnswerApi,
  deleteQuestionApi,
  deleteQuestionsBatchApi,
} from "@/api/questions";
import type { GenerateQuestionsRequest } from "@/types";

export function useQuestions(params: {
  materialId?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => getQuestionsApi(params),
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ["questions", id],
    queryFn: () => getQuestionApi(id),
    enabled: !!id,
  });
}

export function useQuestionWithAnswer(id: string) {
  return useQuery({
    queryKey: ["questions", id, "full"],
    queryFn: () => getQuestionWithAnswerApi(id),
    enabled: !!id,
  });
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GenerateQuestionsRequest) => generateQuestionsApi(params),
    onSuccess: (_data, variables) => {
      // Invalidate questions list for this material
      queryClient.invalidateQueries({
        queryKey: ["questions", { materialId: variables.materialId }],
      });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestionsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionsBatchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
```

### 5.5 Generation Flow UI

**GenerateQuestionsPage flow:**

```
┌────────────────────────────────────────────────────────────┐
│                  Generate Questions Page                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 1: Select Material                             │   │
│  │  [Dropdown of user's materials with "ready" status] │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 2: Select Topic                                │   │
│  │  [Badges showing material's topics - click to select]│   │
│  │  [Only selected topics from material are shown]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 3: Configure Generation                        │   │
│  │                                                       │   │
│  │  Question Types:                                      │   │
│  │  [x] Multiple Choice  [ ] Short Answer  [ ] True/False│  │
│  │                                                       │   │
│  │  Difficulty: [Easy] [Medium*] [Hard]                  │   │
│  │  * Default based on user level                        │   │
│  │                                                       │   │
│  │  Number of Questions: [5] (1-10)                      │   │
│  │                                                       │   │
│  │  [Generate Questions]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Generation Progress                                  │   │
│  │  [Progress bar with "Generating questions..."]       │   │
│  │  [Show cached count if applicable: "2 from cache"]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Generated Questions List                             │   │
│  │  [QuestionCard] x 5                                   │   │
│  │  - Shows question text, type badge, difficulty badge  │   │
│  │  - "View Answer" reveals correctAnswer + explanation  │   │
│  │                                                       │   │
│  │  [Generate More] [Start Practice]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 5.6 Component Specifications

**GenerateQuestionsForm.tsx:**
- Material dropdown (fetches user's materials)
- Topic selection (badges from selected material)
- Type checkboxes (MCQ, short answer, T/F)
- Difficulty selector (radio buttons, default based on user.level)
- Count input (1-10, default 5)
- Submit button

**QuestionCard.tsx:**
- Displays question text
- Type badge (MCQ, Short Answer, True/False)
- Difficulty badge (Easy, Medium, Hard)
- Collapsed state: hides answer
- Expanded state: shows correctAnswer and explanation
- Delete button (with confirmation)

**QuestionList.tsx:**
- Grid/list of QuestionCard components
- Filters (by type, difficulty)
- Pagination
- Empty state: "No questions generated yet"

---

## 6. Question Validation Approach (QGEN-08)

### 6.1 Validation Pipeline

Questions must pass multiple validation checks before being saved:

```
┌──────────────────────────────────────────────────────────────┐
│                    AI Response Received                       │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  1. JSON Parse Validation                                     │
│     - Response must be valid JSON                             │
│     - Must have "questions" array                             │
│     → Fail: retry with stricter prompt (1x)                   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  2. Schema Validation (Zod)                                   │
│     - Each question has required fields                       │
│     - Field types match schema                                │
│     → Fail: filter out invalid questions, log warning         │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  3. MCQ Option Validation                                     │
│     - MCQ must have exactly 4 options                         │
│     - correctAnswer must be one of the options                │
│     → Fail: filter out invalid MCQ questions                  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  4. True/False Validation                                     │
│     - correctAnswer must be "True" or "False"                 │
│     → Fail: filter out invalid T/F questions                  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  5. Source Grounding Validation                               │
│     - sourceExcerpt must exist in material text               │
│     - At least 80% word match                                 │
│     → Fail: filter out ungrounded questions, log warning      │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  6. Minimum Questions Check                                   │
│     - At least 1 valid question must remain                   │
│     → Fail: throw GENERATION_FAILED error                     │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                  Save Valid Questions to DB                   │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Validation Implementation

```typescript
interface ValidationResult {
  valid: boolean;
  questions: GeneratedQuestion[];
  filtered: number;
  errors: string[];
}

function validateGeneratedQuestions(
  rawQuestions: any[],
  sourceText: string,
  requestedTopic: string
): ValidationResult {
  const errors: string[] = [];
  const validQuestions: GeneratedQuestion[] = [];
  let filtered = 0;

  for (const q of rawQuestions) {
    const issues: string[] = [];

    // Schema validation
    const schemaResult = questionSchema.safeParse(q);
    if (!schemaResult.success) {
      issues.push(`Schema: ${schemaResult.error.message}`);
    }

    // MCQ validation
    if (q.type === "mcq") {
      if (!q.options || q.options.length !== 4) {
        issues.push("MCQ must have 4 options");
      } else if (!q.options.includes(q.correctAnswer)) {
        issues.push("Correct answer not in options");
      }
    }

    // True/False validation
    if (q.type === "true_false") {
      if (!["True", "False"].includes(q.correctAnswer)) {
        issues.push("T/F answer must be 'True' or 'False'");
      }
    }

    // Topic validation
    if (q.topic.toLowerCase() !== requestedTopic.toLowerCase()) {
      issues.push(`Topic mismatch: expected ${requestedTopic}`);
    }

    // Source grounding validation
    if (!validateSourceGrounding(q, sourceText)) {
      issues.push("Question not grounded in source material");
    }

    if (issues.length === 0) {
      validQuestions.push(q);
    } else {
      filtered++;
      errors.push(`Question "${q.text?.slice(0, 50)}...": ${issues.join(", ")}`);
    }
  }

  return {
    valid: validQuestions.length > 0,
    questions: validQuestions,
    filtered,
    errors,
  };
}
```

### 6.3 Retry Strategy

If all questions fail validation:

```typescript
async function generateQuestionsWithRetry(
  params: GenerationParams,
  maxRetries: number = 1
): Promise<GeneratedQuestion[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await callOpenAI(params);
      const parsed = JSON.parse(raw);
      const validation = validateGeneratedQuestions(
        parsed.questions,
        params.sourceText,
        params.topic
      );
      
      if (validation.valid) {
        if (validation.filtered > 0) {
          logger.warn(
            `Filtered ${validation.filtered} invalid questions`,
            { errors: validation.errors }
          );
        }
        return validation.questions;
      }
      
      lastError = new Error("All generated questions failed validation");
      logger.warn(`Attempt ${attempt + 1} failed validation, retrying...`);
      
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt + 1} failed:`, error);
    }
  }
  
  throw new AppError(
    "Unable to generate valid questions. Please try again.",
    500,
    "GENERATION_FAILED"
  );
}
```

---

## 7. Difficulty Mapping Based on User Level (QGEN-04)

### 7.1 Default Difficulty Logic

```typescript
// In question.service.ts

interface UserWithLevel {
  level: "junior" | "senior";
}

function getDefaultDifficulty(user: UserWithLevel): DifficultyLevel {
  // Junior students default to easy questions
  // Senior students default to medium questions
  return user.level === "junior" ? "easy" : "medium";
}

// Usage in generate endpoint
async function handleGenerateQuestions(
  params: GenerateQuestionsInput,
  userId: string
): Promise<GenerateQuestionsResponse> {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  
  // Apply default difficulty if not specified
  const difficulty = params.difficulty || getDefaultDifficulty(user);
  
  // Continue with generation...
}
```

### 7.2 Frontend Default Selection

```typescript
// In GenerateQuestionsForm.tsx

const { user } = useAuth();

const defaultDifficulty = user?.level === "junior" ? "easy" : "medium";

const [difficulty, setDifficulty] = useState<DifficultyLevel>(defaultDifficulty);
```

### 7.3 Difficulty Guidelines in Prompts

The AI prompt includes specific guidelines for each difficulty level to ensure appropriate question complexity:

| Level | Junior Default | Senior Default | Characteristics |
|-------|---------------|----------------|-----------------|
| Easy | Yes | No | Direct recall, explicit facts, definitions |
| Medium | No | Yes | Connections between concepts, application |
| Hard | No | No | Analysis, synthesis, inference |

---

## 8. Batch Generation Strategy (QGEN-07)

### 8.1 Single Request, Multiple Questions

Batch generation means generating multiple questions in a single AI call:

```typescript
// Request: generate 5 MCQ questions about Photosynthesis at medium difficulty
const params = {
  materialId: "65f...",
  topic: "Photosynthesis",
  difficulty: "medium",
  types: ["mcq"],
  count: 5,  // Generate 5 questions in one AI call
};
```

### 8.2 Mixed Type Batch Generation

When requesting multiple types, the AI generates all in one call:

```typescript
const params = {
  materialId: "65f...",
  topic: "Photosynthesis",
  difficulty: "medium",
  types: ["mcq", "short_answer", "true_false"],
  count: 6,  // 2 of each type
};

// Prompt includes:
// "Generate 6 questions (2 MCQ, 2 short answer, 2 true/false)..."
```

### 8.3 Implementation

```typescript
function buildBatchPrompt(params: {
  types: QuestionType[];
  count: number;
}): string {
  const { types, count } = params;
  
  if (types.length === 1) {
    return `Generate exactly ${count} ${types[0]} questions.`;
  }
  
  // Distribute count across types
  const perType = Math.ceil(count / types.length);
  const distribution = types.map(t => `${perType} ${t}`).join(", ");
  
  return `Generate a total of ${count} questions distributed as: ${distribution}.`;
}
```

### 8.4 Token Budget for Batch Generation

| Questions | Est. Output Tokens | Safe? |
|-----------|-------------------|-------|
| 1-5 | 500-2000 | Yes |
| 6-10 | 2000-4000 | Yes |
| 10+ | 4000+ | Risk of truncation |

**Decision:** Cap at 10 questions per batch to stay within token budget.

---

## 9. Integration with Existing Infrastructure

### 9.1 OpenAI Client Integration

The existing `openai-client.ts` provides:
- `chatCompletion()` with retry logic
- `truncateForTokenBudget()` for long texts
- `estimateTokens()` for token counting

Question generator uses these directly:

```typescript
import { chatCompletion, truncateForTokenBudget } from "./openai-client";

async function generateQuestions(params: GenerationParams): Promise<string> {
  const truncatedText = truncateForTokenBudget(params.sourceText, 30000);
  
  return chatCompletion({
    systemPrompt: QUESTION_GENERATOR_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt({ ...params, sourceText: truncatedText }),
    maxTokens: 4000,
    temperature: 0.7,
    jsonMode: true,
  });
}
```

### 9.2 Material Model Integration

Questions reference materials via `materialId`. Generation requires:
1. Fetching material by ID
2. Verifying ownership (`material.userId === requestUserId`)
3. Checking material status is "ready"
4. Reading `material.extractedText` as source content
5. Validating topic exists in `material.topics`

```typescript
async function getMaterialForGeneration(
  materialId: string,
  userId: string,
  requestedTopic: string
): Promise<IMaterial> {
  const material = await Material.findOne({ _id: materialId, userId });
  
  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }
  
  if (material.status !== "ready") {
    throw new AppError(
      "Material is still processing",
      400,
      "MATERIAL_NOT_READY"
    );
  }
  
  const topicExists = material.topics.some(
    t => t.name.toLowerCase() === requestedTopic.toLowerCase() && t.selected
  );
  
  if (!topicExists) {
    throw new AppError(
      `Topic '${requestedTopic}' not found in this material`,
      400,
      "INVALID_TOPIC"
    );
  }
  
  return material;
}
```

### 9.3 User Model Integration

User level affects default difficulty:

```typescript
const user = await User.findById(userId).select("level");
const defaultDifficulty = user.level === "junior" ? "easy" : "medium";
```

### 9.4 Rate Limiting

Apply existing `aiLimiter` to generation endpoint:

```typescript
// In question.routes.ts
router.post(
  "/generate",
  aiLimiter,  // 30 requests per hour
  validate(generateQuestionsSchema),
  async (req, res, next) => { ... }
);
```

### 9.5 Cascade Delete on Material Deletion

Update `material.service.ts` to delete questions when material is deleted:

```typescript
async function deleteMaterial(id: string, userId: string): Promise<void> {
  const material = await Material.findOneAndDelete({ _id: id, userId });
  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }
  
  // Cascade delete all questions for this material
  await Question.deleteMany({ materialId: id, userId });
}
```

---

## 10. Cost Estimation

### 10.1 Token Usage per Generation

| Component | Input Tokens | Output Tokens |
|-----------|--------------|---------------|
| System prompt | ~400 | - |
| Source text (truncated) | ~10,000-30,000 | - |
| User prompt | ~100 | - |
| Generated questions (5) | - | ~1,500-2,500 |

**Estimated cost per generation (5 questions):**
- Input: ~30,000 tokens * $0.15/1M = $0.0045
- Output: ~2,000 tokens * $0.60/1M = $0.0012
- **Total: ~$0.006 per generation**

### 10.2 Rate Limit Impact

With `aiLimiter` at 30 requests/hour:
- Max cost per user per hour: 30 * $0.006 = $0.18
- Max cost per user per day: $4.32 (if continuously hitting limit)

This is acceptable for a learning application. The rate limiter prevents abuse.

---

## 11. Risks and Considerations

### 11.1 AI Response Quality Risks

| Risk | Mitigation |
|------|------------|
| Hallucinated questions | Source grounding validation + sourceExcerpt requirement |
| Incorrect answers | Explanation requirement helps verify; user feedback in Phase 4 |
| Duplicate questions | Cache prevents exact duplicates; vary prompts for variety |
| Off-topic questions | Topic validation in response schema |
| Truncated JSON | Use `jsonMode: true`, retry on parse failure |

### 11.2 Performance Risks

| Risk | Mitigation |
|------|------------|
| Slow generation (5-15s) | Loading UI, 60s timeout, cache for repeated requests |
| Token limit exceeded | `truncateForTokenBudget()` with head+tail strategy |
| Database growth | Questions are relatively small (~1KB each); indexes support efficient queries |

### 11.3 UX Risks

| Risk | Mitigation |
|------|------------|
| User generates same questions repeatedly | Clear "cached" indicator in response |
| Too few questions generated | Minimum validation + retry logic |
| Questions too hard/easy for user | Default difficulty based on user level |

---

## 12. Server Dependencies

### 12.1 No New Dependencies

All required functionality is available from existing dependencies:
- `openai` - already installed (Phase 2)
- `zod` - already installed
- `crypto` - Node.js built-in (for cache key hashing)

---

## 13. File Inventory

### New Server Files

| File | Purpose |
|------|---------|
| `server/src/models/Question.ts` | Mongoose Question model |
| `server/src/routes/question.routes.ts` | Question REST endpoints |
| `server/src/services/question.service.ts` | Question business logic |
| `server/src/services/ai/question-generator.ts` | AI question generation |
| `server/src/schemas/question.schemas.ts` | Zod validation schemas |

### Modified Server Files

| File | Changes |
|------|---------|
| `server/src/app.ts` | Register question routes |
| `server/src/services/material.service.ts` | Add cascade delete for questions |

### New Client Files

| File | Purpose |
|------|---------|
| `client/src/api/questions.ts` | Question API functions |
| `client/src/hooks/use-questions.ts` | TanStack Query hooks |
| `client/src/components/questions/GenerateQuestionsForm.tsx` | Generation form |
| `client/src/components/questions/QuestionTypeSelector.tsx` | Type selection |
| `client/src/components/questions/DifficultySelector.tsx` | Difficulty selection |
| `client/src/components/questions/GenerationProgress.tsx` | Progress indicator |
| `client/src/components/questions/QuestionCard.tsx` | Question display |
| `client/src/components/questions/QuestionList.tsx` | Question list |
| `client/src/components/questions/QuestionPreview.tsx` | Preview without answer |
| `client/src/components/questions/QuestionFilters.tsx` | Filter controls |
| `client/src/pages/GenerateQuestionsPage.tsx` | Generation page |
| `client/src/pages/QuestionsPage.tsx` | Questions browse page |

### Modified Client Files

| File | Changes |
|------|---------|
| `client/src/types/index.ts` | Add Question types |
| `client/src/App.tsx` | Add question routes |
| `client/src/components/layout/Sidebar.tsx` | Add Questions nav link |

---

## 14. Recommended Plan Structure

Based on this research, Phase 3 should be split into **3 plans** across **2 waves**:

### Wave 1 (can be parallelized)

**Plan 03-01: Backend Question Model + AI Generator**
- Create Question Mongoose model with indexes
- Create question-generator AI service with prompts
- Create question validation utilities
- Create cache key generation utility
- Create question service (orchestration + caching)
- Create question validation schemas
- Estimated files: ~5 new

**Plan 03-02: Backend API + Integration**
- Create question routes (all endpoints)
- Update material service with cascade delete
- Update app.ts with question routes
- Integration testing of generation flow
- Estimated files: ~1 new, ~2 modified

### Wave 2

**Plan 03-03: Frontend Generation UI**
- Add Question types to client types
- Create question API functions
- Create TanStack Query hooks
- Create all question components
- Create GenerateQuestionsPage and QuestionsPage
- Update App.tsx routes and Sidebar
- Estimated files: ~12 new, ~3 modified

---

## 15. Validation Checklist

### 15.1 Requirement Verification

| Req | Description | Validation Method |
|-----|-------------|-------------------|
| QGEN-01 | Generate MCQ, short answer, true/false | Manual test: generate each type |
| QGEN-02 | Question fields: text, options, answer, explanation, topic | Schema validation + response check |
| QGEN-03 | Difficulty levels | Generate at each level, verify in response |
| QGEN-04 | User level influences default difficulty | Junior user gets easy default, senior gets medium |
| QGEN-05 | Grounded in source material | Verify sourceExcerpt in response, spot-check manually |
| QGEN-06 | Caching | Generate same params twice, verify second is faster + cached flag |
| QGEN-07 | Batch generation | Request count=5, verify 5 questions returned |
| QGEN-08 | Question validation | Verify invalid questions are filtered, errors logged |

### 15.2 Build Verification

```bash
# Server
cd server && npm run build  # TypeScript compiles with no errors

# Client
cd client && npm run build  # Vite builds with no errors
```

### 15.3 Security Verification

- All question endpoints require valid JWT
- Questions are scoped to authenticated user
- Rate limiting applied to generation endpoint
- No answer data leaked in list responses

---

*Research completed: 2026-03-18*
*Ready for planning phase.*
