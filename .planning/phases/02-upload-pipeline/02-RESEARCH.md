---
phase: 02-upload-pipeline
type: research
requirements: [MATL-01, MATL-02, MATL-03, MATL-04, MATL-05, MATL-06, MATL-07, MATL-08]
depends-on: Phase 1 (Foundation & Auth) — complete
created: 2026-03-17
---

# Phase 2 Research: Upload Pipeline

**Goal:** Enable students to upload PDF and text study materials, extract text content, detect topics via AI, and review/select topics before question generation.

**Requirements covered:** MATL-01 through MATL-08

---

## 1. PDF Text Extraction

### Decision: `pdf-parse` v1.1

**Library:** `pdf-parse@^1.1.1`

**Why pdf-parse over alternatives:**

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| `pdf-parse` | Lightweight (~50KB), no native deps, works in memory, simple API | No OCR (scanned PDFs), last npm publish 2019 but stable | **Selected** |
| `pdfjs-dist` | Mozilla's PDF.js, actively maintained, more robust parsing | Heavy (~2MB), complex API, designed for browser rendering | Overkill |
| `pdf.js-extract` | Better table/column extraction | Less popular, heavier | Not needed |
| `unpdf` | Modern wrapper around pdf.js | Newer, less battle-tested | Not worth the risk |

**API pattern:**

```typescript
import pdf from "pdf-parse";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text; // Full extracted text
  // data.numpages — page count
  // data.info — metadata (title, author, etc.)
}
```

**Memory considerations:**
- pdf-parse processes the entire buffer in memory. The UPLOAD_CONFIG already limits files to 10MB.
- A 10MB PDF typically produces 50-200KB of extracted text. Memory-safe within Node.js defaults.
- No streaming needed at this scale.

**Scanned PDFs (image-only):**
- pdf-parse cannot OCR scanned PDFs. It returns an empty or near-empty string.
- **Decision:** Detect empty extraction (< 50 characters after trimming) and return a clear error: "This PDF appears to be scanned/image-based. Please upload a text-based PDF or paste the content as plain text."
- OCR (Tesseract) is out of scope for v1. The error message guides users to a workaround.

**Error handling for corrupted/password-protected PDFs:**
- pdf-parse throws on corrupted PDFs — catch and return `AppError(422, "PDF_PARSE_FAILED")`.
- Password-protected PDFs throw a specific error — detect via error message and return `AppError(422, "PDF_PASSWORD_PROTECTED")`.
- Catch-all for any other extraction failure: `AppError(422, "PDF_EXTRACTION_FAILED")` with a user-friendly message.

**Installation:**
```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

> Note: `@types/pdf-parse` is community-maintained. If types are insufficient, we'll write a minimal `pdf-parse.d.ts` declaration file.

---

## 2. File Upload Architecture

### 2.1 Multer Configuration

**Decision:** `multer` with `memoryStorage`

**Why memoryStorage:**
- Files are processed immediately (text extraction) and discarded. We only store extracted text in MongoDB, not the raw PDF binary.
- No disk cleanup needed. No temp file vulnerabilities.
- 10MB max file size is safe for memory storage on a typical 512MB–1GB server.
- Matches the pattern in the existing `upload-config.ts` stub.

**Installation:**
```bash
npm install multer
npm install -D @types/multer
```

**Implementation — `server/src/middleware/upload.ts`:**

```typescript
import multer from "multer";
import { UPLOAD_CONFIG } from "./upload-config";
import { AppError } from "./error-handler";

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Invalid file type: ${file.mimetype}. Only PDF and plain text files are allowed.`,
      400,
      "INVALID_FILE_TYPE"
    ));
  }
}

export const uploadSingle = multer({
  storage,
  limits: { fileSize: UPLOAD_CONFIG.maxFileSize },
  fileFilter,
}).single("file"); // Field name: "file"
```

**Multer error handling:**
- Multer throws `MulterError` for size limit violations. The error handler must catch this:

```typescript
// In material route handler or dedicated middleware:
import { MulterError } from "multer";

if (err instanceof MulterError) {
  if (err.code === "LIMIT_FILE_SIZE") {
    throw new AppError("File too large. Maximum size is 10MB.", 413, "FILE_TOO_LARGE");
  }
}
```

### 2.2 Server-Side File Type Validation

Beyond MIME type checking (which clients can spoof), validate the actual file content:

**PDF:** Check magic bytes — PDF files start with `%PDF` (hex: `25 50 44 46`).

```typescript
function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 &&
    buffer[0] === 0x25 && buffer[1] === 0x50 &&
    buffer[2] === 0x44 && buffer[3] === 0x46;
}
```

**Text:** For `.txt` files, the buffer is the raw text. Validate it's valid UTF-8 and non-empty.

### 2.3 Text Chunking Strategy for AI Processing

Documents that exceed GPT-4o-mini's context window (~128K tokens, but practically limit input to ~60K tokens for quality) need chunking.

**Token estimation:** ~4 characters per token for English text. A 10MB PDF extracting to 200KB of text is ~50K tokens — fits in one call for most documents.

**Chunking approach (for topic detection and summarization):**

1. **Estimate tokens:** `Math.ceil(text.length / 4)` (rough estimate; tiktoken for exact count is added as a dependency but rough estimate is sufficient for chunking decisions).
2. **If < 50K tokens:** Send full text to OpenAI in one call.
3. **If >= 50K tokens:** Split text into ~30K-token chunks (with 500-token overlap), process each chunk independently, then merge/deduplicate results.
4. **Chunk splitting:** Split on paragraph boundaries (`\n\n`), falling back to sentence boundaries (`. `), falling back to hard character limit.

**Decision:** Install `tiktoken` for accurate token counting.

```bash
npm install tiktoken
```

### 2.4 MongoDB Document Design for Materials

**Decision:** Store extracted text directly in MongoDB. No separate file storage (S3, GridFS, etc.).

**Rationale:**
- We discard the raw PDF binary after extraction. Only the text is stored.
- Extracted text from a 10MB PDF is typically 50-200KB — well within MongoDB's 16MB document limit.
- Avoids infrastructure complexity (S3 buckets, presigned URLs, etc.).
- Text stored in MongoDB is directly queryable and indexable.

---

## 3. AI Topic Detection

### 3.1 OpenAI Integration

**Library:** `openai@^4.77` (official SDK)

**Installation:**
```bash
npm install openai
```

**Client setup — `server/src/config/openai.ts`:**

```typescript
import OpenAI from "openai";
import { env } from "./env";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
```

**Env validation update — add `OPENAI_API_KEY` to `server/src/config/env.ts`:**

```typescript
const envSchema = z.object({
  // ... existing fields
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
});
```

**Model selection:** `gpt-4o-mini` for all Phase 2 AI tasks (topic detection, summarization).
- Cost: ~$0.15/1M input tokens, ~$0.60/1M output tokens.
- Processing a 200KB document for topics: ~50K input tokens = ~$0.0075 per document. Very affordable.
- Quality is sufficient for topic extraction and summarization.

### 3.2 Topic Detection Prompt Design

**Service file:** `server/src/services/ai/topic-detector.ts`

**System prompt:**

```
You are an expert academic content analyzer. Your task is to identify the main educational topics from study material text.

Rules:
1. Return a JSON object with a single key "topics" containing an array of topic strings.
2. Each topic should be a concise phrase (2-5 words) representing a distinct educational concept.
3. Extract between 3 and 15 topics depending on the material's breadth.
4. Topics should be specific enough to generate study questions from.
5. Order topics from most prominent to least prominent in the text.
6. Do not include meta-topics like "Introduction" or "Conclusion".
7. Do not include generic topics like "Study Guide" or "Chapter Summary".
```

**User prompt template:**

```
Analyze the following study material and extract the main educational topics.

MATERIAL:
---
{text}
---

Return ONLY a JSON object in this exact format:
{"topics": ["Topic 1", "Topic 2", ...]}
```

**API call parameters:**

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: TOPIC_DETECTION_SYSTEM_PROMPT },
    { role: "user", content: `Analyze the following study material...\n\n${text}` },
  ],
  response_format: { type: "json_object" },
  temperature: 0.3, // Low temperature for consistent extraction
  max_tokens: 500,  // Topics list is short
});
```

**Response validation:**

```typescript
const topicResponseSchema = z.object({
  topics: z.array(z.string().min(1).max(100)).min(1).max(20),
});
```

Parse with `JSON.parse()` in try-catch, then validate with Zod. Retry once on parse failure.

### 3.3 Token Limits and Long Documents

For topic detection on long documents:

1. If text fits in ~60K tokens: send full text.
2. If text exceeds 60K tokens: send the first 40K tokens + last 10K tokens (beginning and end of material capture title/intro and conclusion, which are most topic-rich).
3. Alternative for very long documents: summarize chunks first (see Section 4), then detect topics from the combined summary.

**Decision:** Use approach #2 (truncate with head+tail) for topic detection. Full chunked summarization is reserved for MATL-07.

### 3.4 Cost Considerations

| Operation | Est. Input Tokens | Est. Output Tokens | Cost per Operation |
|-----------|-------------------|--------------------|--------------------|
| Topic detection (avg doc) | ~20K | ~200 | ~$0.003 |
| Topic detection (max 10MB PDF) | ~50K | ~200 | ~$0.008 |
| Material summary (avg doc) | ~20K | ~1K | ~$0.004 |
| Material summary (max doc, chunked) | ~60K | ~3K | ~$0.011 |

At 30 uploads/hour (AI rate limit), worst case: ~$0.24/hour, ~$5.76/day. Well within budget.

---

## 4. AI Material Summary (MATL-07)

### 4.1 Summarization Approach

**Decision:** Single-pass summarization for documents under 50K tokens. Chunk-then-merge for longer documents.

**Service file:** `server/src/services/ai/summarizer.ts`

**System prompt:**

```
You are an expert academic summarizer. Create a clear, comprehensive summary of the study material provided.

Rules:
1. The summary should capture all key concepts and their relationships.
2. Use bullet points for main ideas and sub-bullets for supporting details.
3. Maintain academic accuracy — do not add information not present in the source.
4. Keep the summary between 200-800 words depending on material length.
5. Structure the summary with clear section headers if the material covers multiple topics.
```

**Long document strategy (> 50K tokens):**

1. Split text into ~30K token chunks.
2. Summarize each chunk independently (~200-400 words each).
3. Concatenate chunk summaries.
4. Final pass: send concatenated summaries to produce a unified summary.

This "map-reduce" pattern produces coherent summaries even for very long documents.

**API call:**

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: SUMMARIZER_SYSTEM_PROMPT },
    { role: "user", content: `Summarize the following study material:\n\n${text}` },
  ],
  temperature: 0.4,
  max_tokens: 2000,
});
```

### 4.2 Summary Storage

Store the summary directly on the Material document as an optional field. It's generated on-demand when the user requests it, then cached:

```typescript
summary?: string;
summaryGeneratedAt?: Date;
```

---

## 5. Mongoose Model Design

### 5.1 Material Model — `server/src/models/Material.ts`

```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITopic {
  name: string;
  selected: boolean; // User can deselect topics
}

export type MaterialStatus = "processing" | "ready" | "error";
export type MaterialFileType = "pdf" | "text";

export interface IMaterial extends Document {
  userId: Types.ObjectId;
  filename: string;
  fileType: MaterialFileType;
  fileSize: number; // Original file size in bytes
  extractedText: string;
  textLength: number; // Character count of extracted text
  topics: ITopic[];
  status: MaterialStatus;
  errorMessage?: string; // Populated when status is "error"
  summary?: string;
  summaryGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, trim: true },
    selected: { type: Boolean, default: true },
  },
  { _id: false }
);

const materialSchema = new Schema<IMaterial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    fileType: {
      type: String,
      enum: ["pdf", "text"],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    textLength: {
      type: Number,
      required: true,
    },
    topics: {
      type: [topicSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },
    errorMessage: {
      type: String,
    },
    summary: {
      type: String,
    },
    summaryGeneratedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing user's materials sorted by date
materialSchema.index({ userId: 1, createdAt: -1 });

export const Material = mongoose.model<IMaterial>("Material", materialSchema);
```

### 5.2 Design Decisions

**Topics as subdocuments (not separate collection):**
- Topics are tightly bound to their parent material — no cross-material topic relationship needed in Phase 2.
- The `selected` boolean tracks user's topic review decision (MATL-05).
- Array size is bounded (max ~20 topics per material). No unbounded growth risk.
- Separate Topic collection would add unnecessary complexity and joins.
- Phase 5 (WeakTopics) will have its own collection keyed by topic name strings — works fine with this approach.

**Status field:**
- `processing`: Material uploaded, extraction/topic detection in progress.
- `ready`: Extraction and topic detection complete.
- `error`: Extraction failed.

**Why no raw file storage:**
- We extract text immediately and discard the binary. `extractedText` is the source of truth.
- Saves storage costs and avoids file management complexity.
- If a user needs to re-upload, they upload again.

### 5.3 Indexing Strategy

| Index | Purpose |
|-------|---------|
| `{ userId: 1, createdAt: -1 }` | List user's materials sorted by newest first (MATL-06) |
| `{ userId: 1 }` (via the compound index) | Count user's materials, filter by user |

No text index needed for Phase 2. Text search on materials can be added in Phase 6 if needed.

---

## 6. API Endpoint Design

### 6.1 Route File: `server/src/routes/material.routes.ts`

All routes protected by `authenticate` middleware.

| Method | Path | Body / Params | Description | Req |
|--------|------|---------------|-------------|-----|
| `POST` | `/api/materials/upload` | `multipart/form-data` with `file` field | Upload PDF or text file, extract text, detect topics | MATL-01, MATL-02, MATL-03, MATL-04, MATL-08 |
| `GET` | `/api/materials` | Query: `?page=1&limit=20` | List user's materials (paginated) | MATL-06 |
| `GET` | `/api/materials/:id` | — | Get single material with full text and topics | — |
| `PATCH` | `/api/materials/:id/topics` | `{ topics: [{ name, selected }] }` | Update topic selections | MATL-05 |
| `POST` | `/api/materials/:id/summary` | — | Generate or return cached AI summary | MATL-07 |
| `DELETE` | `/api/materials/:id` | — | Delete a material | — |

### 6.2 Route Registration in `app.ts`

```typescript
import materialRoutes from "./routes/material.routes";
// ...
app.use("/api/materials", materialRoutes);
```

### 6.3 Detailed Endpoint Specifications

#### POST `/api/materials/upload`

**Middleware chain:** `authenticate` -> `uploadSingle` (multer) -> handler

**Request:** `multipart/form-data`
- Field `file`: PDF or .txt file (max 10MB)

**Processing pipeline:**
1. Multer validates file type and size.
2. If PDF: validate magic bytes, extract text via pdf-parse.
3. If text: read buffer as UTF-8 string.
4. Validate extracted text is non-empty (>= 50 chars for PDF, >= 10 chars for text).
5. Create Material document with `status: "processing"`.
6. Call topic detection AI service.
7. Update Material with detected topics, set `status: "ready"`.
8. Return material with topics.

**Error responses:**

| Scenario | Status | Code | Message |
|----------|--------|------|---------|
| No file | 400 | `NO_FILE` | "No file uploaded" |
| Invalid MIME type | 400 | `INVALID_FILE_TYPE` | "Only PDF and text files are allowed" |
| File too large | 413 | `FILE_TOO_LARGE` | "File too large. Maximum size is 10MB" |
| PDF magic bytes mismatch | 400 | `INVALID_PDF` | "File does not appear to be a valid PDF" |
| Password-protected PDF | 422 | `PDF_PASSWORD_PROTECTED` | "This PDF is password-protected. Please remove the password and try again" |
| Scanned/image PDF | 422 | `PDF_NO_TEXT` | "This PDF appears to be scanned/image-based. Please upload a text-based PDF or paste the content as plain text" |
| Corrupted PDF | 422 | `PDF_PARSE_FAILED` | "Unable to extract text from this PDF. The file may be corrupted" |
| AI topic detection fails | 500 | `TOPIC_DETECTION_FAILED` | "Unable to detect topics. Please try again" |

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "filename": "biology-chapter-5.pdf",
    "fileType": "pdf",
    "fileSize": 1234567,
    "textPreview": "First 500 characters of extracted text...",
    "textLength": 45000,
    "topics": [
      { "name": "Photosynthesis", "selected": true },
      { "name": "Cellular Respiration", "selected": true }
    ],
    "status": "ready",
    "createdAt": "2026-03-17T..."
  }
}
```

#### GET `/api/materials`

**Query params:** `page` (default 1), `limit` (default 20, max 50)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "filename": "biology-chapter-5.pdf",
      "fileType": "pdf",
      "fileSize": 1234567,
      "textLength": 45000,
      "topicCount": 8,
      "status": "ready",
      "createdAt": "2026-03-17T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

Note: List endpoint returns lightweight data — no `extractedText` or full topic details. Keeps response small.

#### GET `/api/materials/:id`

**Response (200):** Full material including `extractedText` and all topics.

#### PATCH `/api/materials/:id/topics`

**Request body:**

```json
{
  "topics": [
    { "name": "Photosynthesis", "selected": true },
    { "name": "Cellular Respiration", "selected": false }
  ]
}
```

**Validation schema:**

```typescript
const updateTopicsSchema = z.object({
  topics: z.array(z.object({
    name: z.string().min(1).max(100),
    selected: z.boolean(),
  })).min(1).max(20),
});
```

#### POST `/api/materials/:id/summary`

Returns cached summary if exists, otherwise generates and caches.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": "## Key Concepts\n\n- Photosynthesis is...",
    "generatedAt": "2026-03-17T...",
    "cached": true
  }
}
```

**Rate limiting:** Apply `aiLimiter` to this endpoint (already created in Phase 1).

#### DELETE `/api/materials/:id`

Deletes material. In Phase 3, will also cascade-delete associated questions.

### 6.4 Request Validation Schemas — `server/src/schemas/material.schemas.ts`

```typescript
import { z } from "zod";

export const updateTopicsSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().min(1, "Topic name required").max(100),
      selected: z.boolean(),
    })
  ).min(1, "At least one topic required").max(20),
});

export const materialListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const materialIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
});

export type UpdateTopicsInput = z.infer<typeof updateTopicsSchema>;
```

---

## 7. Frontend Architecture

### 7.1 New Dependencies

**Decision:** Use `react-dropzone@^14.3` for the file upload UI.

```bash
npm install react-dropzone
```

No other new client dependencies needed. All UI uses existing shadcn/ui components.

### 7.2 New shadcn/ui Components Needed

Add these components via `npx shadcn@latest add`:
- `badge` — For topic tags
- `checkbox` — For topic selection
- `progress` — For upload progress indicator
- `dialog` — For summary modal
- `scroll-area` — For scrollable text preview
- `textarea` — For plain text upload input
- `tabs` — For switching between PDF upload and text paste

### 7.3 Component Architecture

```
client/src/
├── api/
│   └── materials.ts              # Material API functions
├── hooks/
│   └── use-materials.ts          # TanStack Query hooks for materials
├── schemas/
│   └── material.schemas.ts       # Zod schemas for client-side validation
├── types/
│   └── index.ts                  # Add Material, Topic types
├── components/
│   └── materials/
│       ├── FileUploadZone.tsx     # Drag-and-drop file upload area
│       ├── TextUploadForm.tsx     # Plain text paste form
│       ├── UploadProgress.tsx     # Upload + processing progress indicator
│       ├── TopicReview.tsx        # Topic selection checkboxes
│       ├── MaterialCard.tsx       # Card for material list item
│       ├── MaterialList.tsx       # Full materials list with pagination
│       ├── MaterialDetail.tsx     # Detailed view of a material
│       └── SummaryDialog.tsx      # AI summary in a dialog
├── pages/
│   ├── UploadPage.tsx            # Replace UploadPlaceholder
│   └── MaterialsPage.tsx         # List of uploaded materials
```

### 7.4 Client Types — additions to `client/src/types/index.ts`

```typescript
export interface Topic {
  name: string;
  selected: boolean;
}

export interface Material {
  id: string;
  filename: string;
  fileType: "pdf" | "text";
  fileSize: number;
  textLength: number;
  topicCount: number;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
  createdAt: string;
}

export interface MaterialDetail extends Omit<Material, "topicCount"> {
  extractedText: string;
  textPreview: string;
  topics: Topic[];
  summary?: string;
  summaryGeneratedAt?: string;
}

export interface MaterialListResponse {
  materials: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 7.5 API Layer — `client/src/api/materials.ts`

```typescript
import api from "./client";
import type { MaterialDetail, MaterialListResponse } from "@/types";

export async function uploadMaterialApi(file: File): Promise<MaterialDetail> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/materials/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // 60s timeout for upload + AI processing
  });
  return response.data.data;
}

export async function uploadTextApi(text: string, title: string): Promise<MaterialDetail> {
  // For plain text: create a Blob and upload as file
  const blob = new Blob([text], { type: "text/plain" });
  const file = new File([blob], `${title}.txt`, { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/materials/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data.data;
}

export async function getMaterialsApi(page = 1, limit = 20): Promise<MaterialListResponse> {
  const response = await api.get(`/materials?page=${page}&limit=${limit}`);
  return response.data.data;
}

export async function getMaterialApi(id: string): Promise<MaterialDetail> {
  const response = await api.get(`/materials/${id}`);
  return response.data.data;
}

export async function updateTopicsApi(
  id: string,
  topics: Array<{ name: string; selected: boolean }>
): Promise<MaterialDetail> {
  const response = await api.patch(`/materials/${id}/topics`, { topics });
  return response.data.data;
}

export async function generateSummaryApi(id: string): Promise<{
  summary: string;
  generatedAt: string;
  cached: boolean;
}> {
  const response = await api.post(`/materials/${id}/summary`);
  return response.data.data;
}

export async function deleteMaterialApi(id: string): Promise<void> {
  await api.delete(`/materials/${id}`);
}
```

### 7.6 TanStack Query Hooks — `client/src/hooks/use-materials.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaterialsApi,
  getMaterialApi,
  uploadMaterialApi,
  uploadTextApi,
  updateTopicsApi,
  generateSummaryApi,
  deleteMaterialApi,
} from "@/api/materials";

export function useMaterials(page = 1) {
  return useQuery({
    queryKey: ["materials", page],
    queryFn: () => getMaterialsApi(page),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["materials", id],
    queryFn: () => getMaterialApi(id),
    enabled: !!id,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMaterialApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUploadText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, title }: { text: string; title: string }) =>
      uploadTextApi(text, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUpdateTopics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, topics }: { id: string; topics: Array<{ name: string; selected: boolean }> }) =>
      updateTopicsApi(id, topics),
    onSuccess: (data) => {
      queryClient.setQueryData(["materials", data.id], data);
    },
  });
}

export function useGenerateSummary() {
  return useMutation({
    mutationFn: generateSummaryApi,
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaterialApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}
```

### 7.7 Upload Page Flow (UX Design)

The upload page has two tabs: **Upload PDF** and **Paste Text**.

**Upload PDF tab:**
1. `FileUploadZone` — react-dropzone area. Shows file icon, "Drag PDF here or click to browse." Validates file type and size client-side before upload.
2. On file selection: show filename + size, "Upload" button.
3. On upload: `UploadProgress` component shows steps: "Uploading... → Extracting text... → Detecting topics..."
4. On success: navigate to topic review view.

**Paste Text tab:**
1. `TextUploadForm` — textarea with a title input field.
2. "Analyze Topics" button.
3. Same progress flow → topic review.

**Topic Review (after upload):**
1. `TopicReview` component shows all detected topics as checkboxes (all selected by default).
2. User can uncheck topics they don't want.
3. "Save Selections" button saves via PATCH `/api/materials/:id/topics`.
4. "View Material" links to the material detail page.
5. "Upload Another" resets the form.

### 7.8 Materials List Page

- Card grid layout with `MaterialCard` components.
- Each card shows: filename, file type icon (PDF/text), topic count, upload date, status badge.
- Click card → navigate to material detail page.
- Material detail page shows: full text preview (in scroll area), topic list, "Generate Summary" button, "Delete" button.

### 7.9 Route Changes in `App.tsx`

Replace placeholders with real pages:

```tsx
import { UploadPage } from "@/pages/UploadPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { MaterialDetailPage } from "@/pages/MaterialDetailPage";

// Inside routes:
<Route path="/upload" element={<UploadPage />} />
<Route path="/materials" element={<MaterialsPage />} />
<Route path="/materials/:id" element={<MaterialDetailPage />} />
```

Update sidebar navigation to include "Materials" link.

---

## 8. Integration with Existing Code

### 8.1 Upload Config Stub

The `server/src/middleware/upload-config.ts` already exports `UPLOAD_CONFIG`. The new `upload.ts` middleware will import and use these constants directly. No changes to the existing stub needed.

### 8.2 Auth Middleware

All material routes use `authenticate` from `server/src/middleware/authenticate.ts`. The middleware provides `req.userId` which is used to scope all material queries to the authenticated user.

**Route pattern (consistent with user.routes.ts):**

```typescript
const router = Router();
router.use(authenticate as any); // Apply to all material routes
```

### 8.3 Rate Limiting

- Upload endpoint: Use `globalLimiter` (100 req/15 min) — sufficient for uploads.
- Summary endpoint: Apply `aiLimiter` (30 req/hour) — prevents OpenAI cost abuse.
- Topic detection runs as part of upload, which is already rate-limited by the global limiter.

### 8.4 Error Handler Integration

All new errors use the existing `AppError` class from `server/src/middleware/error-handler.ts`. The error handler already catches `AppError` and formats the response correctly.

Multer errors need special handling — add a multer error middleware or handle in route:

```typescript
// Wrap multer middleware to convert MulterError to AppError
export function handleMulterError(err: any, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new AppError("File too large. Maximum size is 10MB.", 413, "FILE_TOO_LARGE"));
      return;
    }
    next(new AppError(`Upload error: ${err.message}`, 400, "UPLOAD_ERROR"));
    return;
  }
  next(err);
}
```

### 8.5 Express App Structure

Add material routes to `server/src/app.ts` following the existing pattern:

```typescript
import materialRoutes from "./routes/material.routes";
// After existing routes:
app.use("/api/materials", materialRoutes);
```

### 8.6 Service Layer Structure

New service files:

```
server/src/services/
├── auth.service.ts          # (existing)
├── material.service.ts      # Material CRUD + upload orchestration
└── ai/
    ├── openai-client.ts     # OpenAI SDK wrapper with retry logic
    ├── topic-detector.ts    # Topic detection prompt + parsing
    └── summarizer.ts        # Material summarization
```

The `ai/` subdirectory isolates AI logic for maintainability. Each AI service file has:
- Prompt constants at the top
- A single exported function
- Zod schema for response validation

### 8.7 Utility Files

```
server/src/utils/
└── pdf-parser.ts            # PDF text extraction wrapper around pdf-parse
```

---

## 9. Server Dependencies to Install

### Production Dependencies

```bash
cd server
npm install multer pdf-parse openai tiktoken
```

### Dev Dependencies

```bash
npm install -D @types/multer @types/pdf-parse
```

### Summary of All New Server Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `multer` | ^1.4 | File upload middleware (multipart/form-data) |
| `pdf-parse` | ^1.1 | PDF text extraction |
| `openai` | ^4.77 | OpenAI API SDK |
| `tiktoken` | ^1.0 | Token counting for text chunking decisions |
| `@types/multer` | latest | TypeScript types for multer (dev) |
| `@types/pdf-parse` | latest | TypeScript types for pdf-parse (dev) |

### Client Dependencies

```bash
cd client
npm install react-dropzone
npx shadcn@latest add badge checkbox progress dialog scroll-area textarea tabs
```

| Package | Version | Purpose |
|---------|---------|---------|
| `react-dropzone` | ^14.3 | Drag-and-drop file upload UI |

---

## 10. Synchronous vs Asynchronous Upload Processing

### Decision: Synchronous processing within the request

**Rationale:**
- Topic detection via gpt-4o-mini typically takes 2-5 seconds. Combined with PDF extraction (<1 second), total processing time is 3-6 seconds.
- This is acceptable for a loading spinner UX. The frontend sets a 60-second timeout.
- Async processing (background jobs with polling) adds significant complexity: job queue, status polling, SSE/WebSocket — all overkill for 3-6 second operations.
- The architecture research doc notes: "For v1 simplicity, a loading spinner with the synchronous approach is acceptable if generation stays under 10 seconds."

**Implementation:**
1. Upload request starts.
2. Server extracts text (< 1s).
3. Server calls OpenAI for topic detection (2-5s).
4. Server saves material with topics.
5. Server responds.
6. Client shows progress steps during the wait.

**Mitigation for slow responses:**
- Client shows animated progress steps ("Uploading...", "Extracting text...", "Detecting topics...") — gives perception of progress even though it's a single request.
- 60-second client timeout.
- If OpenAI is down, the material is saved with `status: "error"` and user sees a clear message.

---

## 11. Environment Configuration Updates

### `.env` additions:

```
OPENAI_API_KEY=sk-...
```

### `server/src/config/env.ts` — add to schema:

```typescript
OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
```

### `.env.example` — add:

```
OPENAI_API_KEY=your-openai-api-key-here
```

---

## 12. Validation Architecture

This section defines how each requirement is validated and what constitutes a passing test.

### 12.1 Requirement Validation Matrix

| Req | Description | Validation Method | Pass Criteria |
|-----|-------------|-------------------|---------------|
| MATL-01 | Upload PDF files (with size limit) | Manual test + automated | POST `/api/materials/upload` with a PDF returns 201. Uploading >10MB returns 413. |
| MATL-02 | Upload plain text content | Manual test + automated | POST `/api/materials/upload` with a .txt file returns 201. Text content is extracted correctly. |
| MATL-03 | Extract text from PDFs automatically | Manual test | Upload a known PDF, verify `extractedText` in response matches expected content. |
| MATL-04 | Detect topics using AI | Manual test | Upload a document, verify `topics` array in response contains relevant educational topics (3-15 items). |
| MATL-05 | Review/select/deselect topics | Manual test | PATCH `/api/materials/:id/topics` with modified selections returns updated topics. UI shows checkboxes. |
| MATL-06 | View list of uploaded materials | Manual test | GET `/api/materials` returns paginated list. Materials page renders cards. |
| MATL-07 | Request AI-generated summary | Manual test | POST `/api/materials/:id/summary` returns a summary string. Second call returns cached result. |
| MATL-08 | Handle PDF errors gracefully | Manual test | Upload corrupted PDF → clear error message. Upload scanned PDF → clear guidance message. |

### 12.2 Smoke Test Sequence (Without OpenAI Key)

These tests can run without a real OpenAI API key by mocking the AI service:

1. **Upload validation tests (no AI needed):**
   - Upload a valid PDF → verify text extraction succeeds (pdf-parse is local).
   - Upload a .txt file → verify text content is stored.
   - Upload a .jpg → verify 400 error with "INVALID_FILE_TYPE".
   - Upload an 11MB file → verify 413 error with "FILE_TOO_LARGE".
   - Upload with no file → verify 400 error with "NO_FILE".
   - Upload a corrupt PDF → verify 422 error with clear message.

2. **Material CRUD tests (no AI needed):**
   - GET `/api/materials` with auth → verify 200 with empty list.
   - Create a material (mock AI topics), GET list → verify it appears.
   - GET `/api/materials/:id` → verify full detail response.
   - PATCH `/api/materials/:id/topics` → verify topic selection updates.
   - DELETE `/api/materials/:id` → verify deletion.

3. **Auth protection tests:**
   - All material endpoints without auth token → verify 401.

4. **AI service tests (mock OpenAI):**
   - Mock `openai.chat.completions.create` to return a known JSON response.
   - Verify topic detection parses the mock response correctly.
   - Verify summarization returns the mock summary.
   - Verify Zod validation catches malformed AI responses.

### 12.3 Integration Test Sequence (With OpenAI Key)

Full end-to-end testing with a real API key:

1. Upload a real academic PDF → verify topics are educationally relevant.
2. Upload plain text about a known subject → verify topics match the subject.
3. Request summary for uploaded material → verify summary is coherent.
4. Upload a scanned PDF → verify clear error message.
5. Upload a very small PDF (< 50 chars extracted) → verify "PDF_NO_TEXT" error.

### 12.4 Frontend Validation Checklist

| Check | Method |
|-------|--------|
| Upload page renders with two tabs (PDF / Text) | Visual inspection |
| Drag-and-drop zone accepts PDF files | Manual test |
| File type rejection shows toast error | Manual test |
| Upload progress indicators display during processing | Manual test |
| Topic review shows all topics with checkboxes | Manual test |
| Topics can be selected/deselected and saved | Manual test |
| Materials list page shows uploaded materials | Manual test |
| Material detail page shows text preview and topics | Manual test |
| Summary dialog shows AI-generated summary | Manual test |
| Delete material removes it from list | Manual test |
| All pages are mobile-responsive | Manual test (resize browser) |
| Unauthenticated access redirects to login | Manual test |

### 12.5 Build Verification

```bash
# Server
cd server && npm run build  # TypeScript compiles with no errors

# Client
cd client && npm run build  # Vite builds with no errors, no warnings
```

### 12.6 Security Verification

- OPENAI_API_KEY not present in client bundle: `grep -r "sk-" client/dist/` returns nothing.
- Upload endpoint rejects files beyond 10MB.
- Upload endpoint rejects non-PDF/text MIME types.
- All material endpoints require valid JWT.
- Material queries are scoped to authenticated user (no user can access another's materials).

---

## 13. File Inventory

### New Server Files

| File | Purpose |
|------|---------|
| `server/src/models/Material.ts` | Mongoose Material model |
| `server/src/routes/material.routes.ts` | Material REST endpoints |
| `server/src/services/material.service.ts` | Material business logic |
| `server/src/services/ai/openai-client.ts` | OpenAI SDK wrapper with retry |
| `server/src/services/ai/topic-detector.ts` | Topic detection AI service |
| `server/src/services/ai/summarizer.ts` | Material summarization AI service |
| `server/src/schemas/material.schemas.ts` | Zod validation schemas for materials |
| `server/src/middleware/upload.ts` | Multer configuration middleware |
| `server/src/utils/pdf-parser.ts` | PDF text extraction utility |
| `server/src/config/openai.ts` | OpenAI client initialization |

### Modified Server Files

| File | Changes |
|------|---------|
| `server/src/config/env.ts` | Add `OPENAI_API_KEY` to schema |
| `server/src/app.ts` | Register material routes |
| `server/package.json` | Add multer, pdf-parse, openai, tiktoken |

### New Client Files

| File | Purpose |
|------|---------|
| `client/src/api/materials.ts` | Material API functions |
| `client/src/hooks/use-materials.ts` | TanStack Query hooks |
| `client/src/schemas/material.schemas.ts` | Client-side Zod schemas |
| `client/src/components/materials/FileUploadZone.tsx` | Drag-and-drop upload |
| `client/src/components/materials/TextUploadForm.tsx` | Plain text paste form |
| `client/src/components/materials/UploadProgress.tsx` | Progress indicators |
| `client/src/components/materials/TopicReview.tsx` | Topic selection UI |
| `client/src/components/materials/MaterialCard.tsx` | Material list item card |
| `client/src/components/materials/MaterialList.tsx` | Paginated material list |
| `client/src/components/materials/MaterialDetail.tsx` | Full material view |
| `client/src/components/materials/SummaryDialog.tsx` | Summary dialog |
| `client/src/pages/UploadPage.tsx` | Upload page |
| `client/src/pages/MaterialsPage.tsx` | Materials list page |
| `client/src/pages/MaterialDetailPage.tsx` | Material detail page |

### Modified Client Files

| File | Changes |
|------|---------|
| `client/src/types/index.ts` | Add Material, Topic, MaterialDetail types |
| `client/src/App.tsx` | Replace placeholders, add material routes |
| `client/src/components/layout/Sidebar.tsx` | Add "Materials" nav link |
| `client/package.json` | Add react-dropzone |

### New shadcn/ui Components

`badge`, `checkbox`, `progress`, `dialog`, `scroll-area`, `textarea`, `tabs`

---

## 14. Recommended Plan Structure

Based on this research, Phase 2 should be split into **3 plans** across **2 waves**:

### Wave 1 (can be parallelized)

**Plan 02-01: Backend Upload + PDF Extraction + Material Model**
- Install server dependencies (multer, pdf-parse, openai, tiktoken)
- Create Material Mongoose model
- Create upload middleware (multer with UPLOAD_CONFIG)
- Create PDF parser utility
- Create OpenAI client config
- Create AI topic detector service
- Create AI summarizer service
- Create material service (orchestration)
- Create material routes (all 6 endpoints)
- Create material validation schemas
- Update env.ts with OPENAI_API_KEY
- Update app.ts with material routes
- Estimated files: ~10 new, ~3 modified

**Plan 02-02: Frontend Upload UI + Materials Pages**
- Install client dependencies (react-dropzone)
- Add new shadcn/ui components (badge, checkbox, progress, dialog, scroll-area, textarea, tabs)
- Create Material/Topic types
- Create material API functions
- Create TanStack Query hooks
- Create all material components (FileUploadZone, TextUploadForm, UploadProgress, TopicReview, MaterialCard, MaterialList, MaterialDetail, SummaryDialog)
- Create UploadPage, MaterialsPage, MaterialDetailPage
- Update App.tsx routes
- Update Sidebar navigation
- Estimated files: ~14 new, ~4 modified

### Wave 2

**Plan 02-03: Integration + Polish + Validation**
- End-to-end testing of upload flow
- Error state handling and messaging
- Mobile responsiveness adjustments
- Edge case fixes discovered during integration
- Build verification (both client and server)
- Requirement verification against MATL-01 through MATL-08

---

*Research completed: 2026-03-17*
*Ready for planning phase.*
