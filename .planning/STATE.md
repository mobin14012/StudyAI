# Project State: StudyAI

## Status
- **Current phase:** Phase 6 — AI Tutor & Extras (In Progress)
- **Current plan:** 06-01 complete, ready for 06-02
- **Overall progress:** 78%

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-17)
**Core value:** Students improve their weak areas through AI-driven adaptive practice
**Current focus:** Phase 6 plan 01 complete — Backend AI Tutor + Rate Limiting

## Phase Progress

| # | Phase | Status | Plans |
|---|-------|--------|-------|
| 1 | Foundation & Auth | ● Complete | 4/4 executed |
| 2 | Upload Pipeline | ● Complete | 3/3 executed |
| 3 | Question Generation | ● Complete | 3/3 executed |
| 4 | Practice Engine | ● Complete | 2/2 executed |
| 5 | Adaptive Learning & Analytics | ● Complete | 2/2 executed |
| 6 | AI Tutor & Extras | ◐ In Progress | 1/? executed |
| 7 | Polish & Deploy | ○ Pending | 0/0 |

## Phase 6 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 06-01 | 1 | Backend AI Tutor + Rate Limiting | ● Complete |

## Phase 5 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 05-01 | 1 | Backend Analytics Service | ● Complete |
| 05-02 | 2 | Frontend Analytics Dashboard | ● Complete |

## Phase 5 — Verification

- **Requirements:** 13/13 addressed (ADPT-01 through ADPT-06, ANLT-01 through ANLT-07)
- **Server build:** `tsc` succeeds (0 errors)
- **Client build:** `vite build` succeeds (2611 modules, 0 errors)
- **New files created:** 10 (2 server, 8 client)
- **Files modified:** 4 (2 server, 2 client)
- **Dependencies added:** recharts (charting library)

## Phase 4 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 04-01 | 1 | Backend Practice Engine | ● Complete |
| 04-02 | 2 | Frontend Practice UI | ● Complete |

## Phase 4 — Verification

- **Requirements:** 8/8 addressed (PRAC-01 through PRAC-08)
- **Server build:** `tsc` succeeds (0 errors)
- **Client build:** `vite build` succeeds (2054 modules, 0 errors)
- **New files created:** 17 (6 server, 11 client)
- **Files modified:** 4 (2 server, 2 client)

## Phase 3 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 03-01 | 1 | Backend Question Model + AI Generator | ● Complete |
| 03-02 | 1 | Backend API + Integration | ● Complete |
| 03-03 | 2 | Frontend Generation UI | ● Complete |

## Phase 3 — Verification

- **Requirements:** 8/8 addressed (QGEN-01 through QGEN-08)
- **Server build:** `tsc` succeeds (0 errors)
- **Client build:** `vite build` succeeds (2043 modules, 0 errors)
- **New files created:** 15 (6 server, 9 client)
- **Files modified:** 5 (2 server, 3 client)

## Phase 2 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 02-01 | 1 | Backend Upload + PDF Extraction + AI Services | ● Complete |
| 02-02 | 1 | Frontend Upload UI + Materials Pages | ● Complete |
| 02-03 | 2 | Integration + Polish | ● Complete |

## Phase 2 — Verification

- **Requirements:** 8/8 addressed (MATL-01 through MATL-08)
- **Server build:** `tsc --noEmit` succeeds
- **Client build:** `vite build` succeeds (2033 modules, 0 errors)
- **Security:** No OPENAI strings in client bundle (SECR-04)
- **Commit:** `931d3b6` (Plans 02-01 + 02-02)

## Phase 1 — Plan Status

| Plan | Wave | Title | Status |
|------|------|-------|--------|
| 01-01 | 1 | Project Scaffolding | ● Complete |
| 01-02 | 2 | Auth Backend | ● Complete |
| 01-03 | 2 | UI Shell & Theme | ● Complete |
| 01-04 | 3 | Auth Frontend + Profile | ● Complete |

## Phase 1 — Verification

- **Requirements:** 21/21 addressed (20 PASS, 1 PARTIAL)
- **Partial:** PageSkeleton component exists but unused — LoadingSpinner used for auth loading state instead. Will be wired when data-fetching pages are built in later phases.
- **Build:** `vite build` succeeds (1939 modules, 0 errors)
- **Commits:** `1b7117e` (Plans 01-01/02/03), `5808a03` (Plan 01-04)

## Accumulated Decisions

- TypeScript everywhere (client + server)
- Zustand (UI state) + TanStack Query (server state) — dual store pattern
- httpOnly cookie refresh token (7d, rotation) + in-memory access token (15min)
- Dark theme by default, shadcn/ui base-nova + Tailwind v4 (oklch tokens)
- Monorepo: client/ (React 19 + Vite 8) and server/ (Express 4.21 + Mongoose 8)
- sameSite: "lax" for cookies (production compatibility)
- bcrypt 12 rounds for password hashing
- Zod for both server validation middleware and client form validation
- react-hook-form + zodResolver for all forms
- Axios with Bearer interceptor + 401 refresh queue pattern
- OpenAI gpt-4o-mini for topic detection, summarization, and question generation
- pdf-parse for PDF text extraction (memory storage, no disk writes)
- Head+tail truncation strategy for long documents (80/20 split)
- Material status tracking: processing → ready/error
- Topic caching via summaryGeneratedAt field
- Question caching via SHA-256 cache key (materialId + topic + difficulty + type)
- Source grounding validation: 80% word match threshold
- User level (junior/senior) determines default question difficulty
- Practice sessions are client-side managed (sessionId is UUID, no Session collection)
- Short answer evaluation via AI with 80+ score threshold for correctness
- MCQ/True-False uses exact match evaluation
- Weak topics identified as topics with < 70% accuracy from past attempts
- Mastery threshold: >= 80% recent accuracy over last 10 attempts
- Topics need minimum 3 attempts to be classified as weak
- Daily progress limited to last 30 days in analytics
- Recharts library for dashboard visualization
- Single $facet aggregation for performant analytics (ANLT-07)
- Per-user AI rate limiting: 30 requests/minute keyed by userId
- Tutor conversation history capped at 10 messages
- Material context truncated to 8000 chars for tutor

## Recent Activity

- 2026-03-17: Phase 1 research completed (01-RESEARCH.md)
- 2026-03-17: Phase 1 plans created (4 plans, 3 waves)
- 2026-03-17: Plan checker approved (PASS_WITH_FLAGS, no blockers)
- 2026-03-17: VALIDATION.md created
- 2026-03-17: Plans 01-01, 01-02, 01-03 executed and committed (`1b7117e`)
- 2026-03-17: Plan 01-04 executed and committed (`5808a03`)
- 2026-03-17: Phase 1 verified — 20/21 PASS, 1 PARTIAL
- 2026-03-17: Phase 1 summaries written (01-03-SUMMARY.md, 01-04-SUMMARY.md)
- 2026-03-17: **Phase 1 COMPLETE**
- 2026-03-17: Phase 2 research completed (02-RESEARCH.md)
- 2026-03-17: Phase 2 plans created (3 plans, 2 waves)
- 2026-03-17: Phase 2 Plans 02-01 + 02-02 executed and committed (`931d3b6`)
- 2026-03-18: Phase 2 verified — 8/8 requirements PASS
- 2026-03-18: **Phase 2 COMPLETE**
- 2026-03-18: Phase 3 research completed (RESEARCH.md)
- 2026-03-18: Phase 3 plans created (3 plans, 2 waves)
- 2026-03-18: Phase 3 Plans 03-01, 03-02, 03-03 executed
- 2026-03-18: Phase 3 verified — 8/8 requirements PASS
- 2026-03-18: **Phase 3 COMPLETE**
- 2026-03-18: Phase 4 research completed (RESEARCH.md)
- 2026-03-18: Phase 4 plans created (2 plans, 2 waves)
- 2026-03-18: Phase 4 Plans 04-01, 04-02 executed
- 2026-03-18: Phase 4 verified — 8/8 requirements PASS
- 2026-03-18: **Phase 4 COMPLETE**
- 2026-03-18: Phase 5 research completed (RESEARCH.md)
- 2026-03-18: Phase 5 plans created (2 plans, 2 waves)
- 2026-03-18: Phase 5 Plans 05-01, 05-02 executed
- 2026-03-18: Phase 5 verified — 13/13 requirements PASS
- 2026-03-18: **Phase 5 COMPLETE**
- 2026-03-18: Phase 6 Plan 06-01 executed (Backend AI Tutor + Rate Limiting)

---
*Last updated: 2026-03-18 after Plan 06-01 completion*
