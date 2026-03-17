# Roadmap: StudyAI

**Created:** 2026-03-17
**Granularity:** Standard
**Total phases:** 7
**Total requirements:** 70

> **Note:** The original planning context cited 54 requirements. After full enumeration of REQUIREMENTS.md, the actual v1 count is **70** across 11 categories. All 70 are mapped below.

## Phase Overview

| # | Phase | Goal | Requirements | Plans (est.) |
|---|-------|------|-------------|-------------|
| 1 | Foundation & Auth | Scaffold project, implement auth, user profiles, base security, and core UI shell | 21 | 4 |
| 2 | Upload Pipeline | Enable study material upload, PDF extraction, AI topic detection, and topic review | 10 | 3 |
| 3 | Question Generation | Generate diverse AI-powered questions from user materials with caching | 8 | 3 |
| 4 | Practice Engine | Build the core study loop — practice sessions, answer evaluation, feedback, and attempt tracking | 8 | 3 |
| 5 | Adaptive Learning & Analytics | Track weak topics, enable drill mode, and deliver analytics dashboard | 13 | 4 |
| 6 | AI Tutor & Extras | Add conversational AI tutor, Pomodoro timer, bookmarks, notes, and goal features | 4 | 3 |
| 7 | Polish & Deploy | Final UI polish, mobile optimization, performance, and production deployment | 6 | 3 |

---

## Phase 1: Foundation & Auth

**Goal:** Scaffold the full-stack project structure (React + Express + MongoDB), implement secure JWT authentication with refresh token rotation, user profiles with level selection, base security middleware, and the core UI shell with dark theme.

**Requirements:**
- AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
- PROF-01, PROF-02, PROF-03
- UIUX-01, UIUX-02, UIUX-03, UIUX-04
- SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06
- UIUX-06

**Success Criteria:**
1. User can register, log in, and log out — session persists across browser refreshes via refresh token
2. User can set their level during signup and change it in profile settings
3. App renders in dark theme by default with working light mode toggle, responsive on mobile
4. Invalid/malformed API requests are rejected with clear error messages; auth endpoints are rate-limited
5. OpenAI API key is never present in client bundle (verified via build inspection)

**Dependencies:** None

---

## Phase 2: Upload Pipeline

**Goal:** Enable students to upload PDF and text study materials, extract text content, detect topics via AI, and review/select topics before question generation.

**Requirements:**
- MATL-01, MATL-02, MATL-03, MATL-04, MATL-05, MATL-06, MATL-07, MATL-08

**Success Criteria:**
1. User can upload a PDF file and see extracted text content without errors
2. System detects topics from uploaded material and displays them for user review
3. User can select/deselect topics before proceeding to question generation
4. User can view a list of all their uploaded materials
5. PDF extraction errors show clear, actionable error messages to the user

**Dependencies:** Phase 1

---

## Phase 3: Question Generation

**Goal:** Generate MCQ, short answer, and true/false questions from selected topics using OpenAI, with difficulty levels, proper metadata, and question caching.

**Requirements:**
- QGEN-01, QGEN-02, QGEN-03, QGEN-04, QGEN-05, QGEN-06, QGEN-07, QGEN-08

**Success Criteria:**
1. System generates all three question types (MCQ, short answer, true/false) from selected topics
2. Each generated question includes text, options (if MCQ), correct answer, explanation, and topic tag
3. Questions are grounded in source material — spot-checking reveals no hallucinated content
4. Requesting the same material + topic + difficulty a second time returns cached questions (no OpenAI call)

**Dependencies:** Phase 2

---

## Phase 4: Practice Engine

**Goal:** Build the core study loop — users practice questions one at a time, submit answers, receive immediate feedback with explanations, and all attempts are recorded.

**Requirements:**
- PRAC-01, PRAC-02, PRAC-03, PRAC-04, PRAC-05, PRAC-06, PRAC-07, PRAC-08

**Success Criteria:**
1. User can start a practice session and see questions displayed one at a time
2. MCQ and true/false answers are checked by exact match; short answers are evaluated by AI semantically
3. User sees immediate correct/incorrect feedback with explanation after each submission
4. User can choose between general practice (mixed topics) and weak-topic drill mode
5. Every attempt (question, answer, result) is persisted in the database

**Dependencies:** Phase 3

---

## Phase 5: Adaptive Learning & Analytics

**Goal:** Implement weak topic tracking with mastery graduation, adaptive question generation for weak areas, and a full analytics dashboard with charts and trend data.

**Requirements:**
- ADPT-01, ADPT-02, ADPT-03, ADPT-04, ADPT-05, ADPT-06
- ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05, ANLT-06, ANLT-07

**Success Criteria:**
1. System correctly identifies weak topics based on per-topic error rates and displays them to the user
2. Weak topic drill mode generates questions specifically targeting the user's weak areas
3. Topics graduate from weak status when recent accuracy exceeds the mastery threshold
4. Analytics dashboard shows total attempts, accuracy, per-topic breakdown chart, and progress over time
5. Dashboard loads quickly using pre-aggregated data (no noticeable lag)

**Dependencies:** Phase 4

---

## Phase 6: AI Tutor & Extras

**Goal:** Add conversational AI tutor grounded in user materials, plus engagement features: Pomodoro timer, daily streaks, goal setting, bookmarks, and notes.

**Requirements:**
- TUTR-01, TUTR-02, TUTR-03, TUTR-04
- XTRA-01, XTRA-02, XTRA-03, XTRA-04, XTRA-05
- PROF-04, PROF-05, PROF-06
- SECR-06

**Success Criteria:**
1. User can ask the AI tutor to explain a topic and receive responses grounded in their uploaded materials
2. Chat tutor maintains conversation history and supports follow-up questions within a session
3. Pomodoro timer functions with configurable work/break intervals during study sessions
4. User can set daily question goals, track consecutive-day streaks, and see streak reset on missed days
5. User can bookmark questions, view all bookmarks, and create/edit/delete searchable notes

**Dependencies:** Phase 2 (tutor needs materials), Phase 4 (bookmarks need questions)

---

## Phase 7: Polish & Deploy

**Goal:** Final UI/UX polish, mobile responsiveness audit, answer feedback visual refinement, performance optimization, and production deployment to Vercel/Render/MongoDB Atlas.

**Requirements:**
- UIUX-05

**Success Criteria:**
1. Answer feedback uses clear visual indicators (green/red coloring, explanation prominently visible)
2. All pages pass mobile responsiveness audit on common phone screen sizes
3. App is deployed and accessible: frontend on Vercel, backend on Render/Railway, database on MongoDB Atlas
4. End-to-end flow works in production: register → upload → generate → practice → see analytics

**Dependencies:** All previous phases

---

## Requirement Coverage

| Requirement | Phase |
|------------|-------|
| AUTH-01 | 1 |
| AUTH-02 | 1 |
| AUTH-03 | 1 |
| AUTH-04 | 1 |
| AUTH-05 | 1 |
| AUTH-06 | 1 |
| PROF-01 | 1 |
| PROF-02 | 1 |
| PROF-03 | 1 |
| PROF-04 | 6 |
| PROF-05 | 6 |
| PROF-06 | 6 |
| MATL-01 | 2 |
| MATL-02 | 2 |
| MATL-03 | 2 |
| MATL-04 | 2 |
| MATL-05 | 2 |
| MATL-06 | 2 |
| MATL-07 | 2 |
| MATL-08 | 2 |
| QGEN-01 | 3 |
| QGEN-02 | 3 |
| QGEN-03 | 3 |
| QGEN-04 | 3 |
| QGEN-05 | 3 |
| QGEN-06 | 3 |
| QGEN-07 | 3 |
| QGEN-08 | 3 |
| PRAC-01 | 4 |
| PRAC-02 | 4 |
| PRAC-03 | 4 |
| PRAC-04 | 4 |
| PRAC-05 | 4 |
| PRAC-06 | 4 |
| PRAC-07 | 4 |
| PRAC-08 | 4 |
| ADPT-01 | 5 |
| ADPT-02 | 5 |
| ADPT-03 | 5 |
| ADPT-04 | 5 |
| ADPT-05 | 5 |
| ADPT-06 | 5 |
| ANLT-01 | 5 |
| ANLT-02 | 5 |
| ANLT-03 | 5 |
| ANLT-04 | 5 |
| ANLT-05 | 5 |
| ANLT-06 | 5 |
| ANLT-07 | 5 |
| TUTR-01 | 6 |
| TUTR-02 | 6 |
| TUTR-03 | 6 |
| TUTR-04 | 6 |
| UIUX-01 | 1 |
| UIUX-02 | 1 |
| UIUX-03 | 1 |
| UIUX-04 | 1 |
| UIUX-05 | 7 |
| UIUX-06 | 1 |
| XTRA-01 | 6 |
| XTRA-02 | 6 |
| XTRA-03 | 6 |
| XTRA-04 | 6 |
| XTRA-05 | 6 |
| SECR-01 | 1 |
| SECR-02 | 1 |
| SECR-03 | 1 |
| SECR-04 | 1 |
| SECR-05 | 1 |
| SECR-06 | 6 |

**Coverage: 70/70 (100%)**

---
*Roadmap created: 2026-03-17*
