# Research Summary: StudyAI

**Synthesized:** 2026-03-17
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Recommended Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + Vite 6 + TypeScript | Fast HMR, modern React features, type safety |
| **Routing** | React Router v7 | Type-safe, merged with Remix, loaders/actions |
| **State** | Zustand (UI) + TanStack Query v5 (server) | Clean separation of concerns, minimal boilerplate |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Dark-first, responsive, professional look with minimal custom CSS |
| **Charts** | Recharts | Best React integration for analytics dashboard |
| **Backend** | Express 4.21 on Node.js 20 LTS | Battle-tested, mature ecosystem |
| **Validation** | Zod (shared client/server) | Single source of truth for schemas |
| **Auth** | jsonwebtoken + bcryptjs | Direct JWT implementation, no Passport overhead |
| **Upload** | multer + pdf-parse | Standard file upload + PDF text extraction |
| **Database** | MongoDB 7 via Mongoose 8 | Flexible schema for varied question types |
| **AI** | OpenAI SDK v4 | Structured outputs, streaming, function calling |
| **AI Model** | gpt-4o-mini (default) + gpt-4o (complex gen) | Cost optimization |

**Do NOT use:** CRA (dead), Redux (overkill), Moment.js (legacy), Passport.js (unnecessary for JWT-only), localStorage for tokens (security risk), Bootstrap (conflicts with Tailwind).

---

## Feature Priorities

### v1 (Table Stakes + Core Differentiators)

| Category | Features |
|----------|----------|
| **Auth** | Register, login, logout, JWT sessions, password hashing |
| **Profile** | Self-declared level (junior/senior), basic progress display |
| **Upload** | PDF/text upload, text extraction, AI topic detection |
| **Topic Review** | User reviews & selects detected topics before generation |
| **Question Gen** | MCQ, short answer, true/false at 3 difficulty levels |
| **Practice** | One-by-one questions, immediate feedback, explanations |
| **Weak Topics** | Per-topic error tracking, drill mode (user chooses) |
| **Analytics** | Accuracy, attempts count, weak topics list, per-topic charts |
| **UI** | Dark-first, mobile responsive, clean/minimal |

### v1.x (After Validation)

AI smart answer evaluation, AI chat tutor, AI material summaries, Pomodoro timer, daily streaks, goal setting, bookmarks, notes section.

### Anti-Features (NOT Building)

Spaced repetition, flashcards, social features, leaderboards, OAuth, video content, offline mode, admin dashboards, user-authored questions.

---

## Architecture Overview

**Structure:** 3-tier monolith — React SPA | Express API | MongoDB Atlas

**Key patterns:**
1. **AI Service Layer** — Dedicated module isolating all OpenAI calls. Routes never call OpenAI directly. Each AI capability (question gen, answer eval, summarization, chat) has its own file with its own prompts.
2. **Multi-step Upload Pipeline** — Upload → extract text → detect topics → user reviews → generate questions. Each step is a separate API call. User checkpoint in the middle prevents bad question generation.
3. **Separate collections** — Users, Materials, Questions, Attempts, WeakTopics. References via userId, compound indexes for performance.
4. **httpOnly cookies** for refresh tokens (not localStorage).

**Project structure:** `client/` (React/Vite) + `server/` (Express) at project root.

---

## Critical Risks & Mitigations

| # | Pitfall | Severity | Mitigation |
|---|---------|----------|------------|
| 1 | **OpenAI cost explosion** | CRITICAL | Per-user token budgets, cache questions aggressively, gpt-4o-mini for cheap ops, generation queue |
| 2 | **Hallucinated questions/wrong answers** | CRITICAL | Structured output, source citation required, "report question" button, bias toward MCQ/TF in v1 |
| 3 | **PDF extraction garbage** | HIGH | Explicit error detection, user review step catches bad extraction, error messaging |
| 4 | **Cold start problem** | HIGH | 5-question calibration + level-aware initial difficulty distribution |
| 5 | **Weak topics with no escape** | HIGH | Track recent accuracy, mastery thresholds to "graduate" from weak status |
| 6 | **Blocking UI during generation** | HIGH | Async generation with polling/progress updates, Render has 30s timeout |
| 7 | **JWT with no refresh flow** | MEDIUM | Build refresh token rotation in Phase 1 — nearly impossible to retrofit |

---

## Recommended Build Order

| Phase | Focus | Dependencies | Delivers |
|-------|-------|-------------|----------|
| 1 | **Foundation** | None | Auth, user profiles, project scaffolding, DB models, API skeleton |
| 2 | **Upload Pipeline** | Phase 1 | PDF upload, text extraction, AI topic detection, topic review UI |
| 3 | **Question Generation** | Phase 2 | AI question gen (3 types, 3 difficulties), question storage |
| 4 | **Practice Engine** | Phase 3 | Practice sessions, answer checking, feedback, attempt storage, weak topic tracking, drill mode |
| 5 | **Analytics** | Phase 4 | Dashboard, charts, progress tracking, per-topic accuracy |
| 6 | **AI Tutor + Extras** | Phase 2+ | Chat tutor, summaries, smart answer eval, Pomodoro, streaks, goals, bookmarks, notes |
| 7 | **Polish & Deploy** | All | Dark/light theme polish, mobile optimization, Vercel/Render deployment |

**Critical path:** Phases 1→2→3→4. After Phase 4, the core study loop is functional.

---

## Key Recommendations

1. **Start with gpt-4o-mini everywhere**, upgrade to gpt-4o only for question generation if quality demands it
2. **Build the refresh token flow in Phase 1** — retrofitting is a nightmare
3. **The topic review step is non-negotiable** — it's the quality checkpoint that prevents bad questions
4. **Cache generated questions** — never regenerate for the same material + topic + difficulty combo
5. **Track per-request OpenAI costs from day one** — add cost logging before any AI integration goes live
6. **Weak topic tracking must have a "mastery" exit condition** — count recovery, not just failures

---
*Synthesized: 2026-03-17 from 4 research dimensions*
