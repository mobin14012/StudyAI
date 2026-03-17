# Requirements: StudyAI

**Defined:** 2026-03-17
**Core Value:** Students improve their weak areas through AI-driven adaptive practice — the system identifies what you're bad at and hammers it until you're not.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User password is hashed before storage (bcrypt)
- [ ] **AUTH-03**: User can log in and receive JWT access token
- [ ] **AUTH-04**: User session persists via refresh token rotation (httpOnly cookies)
- [ ] **AUTH-05**: User can log out from any page (tokens invalidated)
- [ ] **AUTH-06**: User receives clear error messages for invalid credentials

### User Profile

- [ ] **PROF-01**: User can set level during signup (junior/senior)
- [ ] **PROF-02**: User can change level from profile settings
- [ ] **PROF-03**: User can view their progress summary (accuracy, total attempts)
- [ ] **PROF-04**: User can set daily question goal (e.g., 20 questions/day)
- [ ] **PROF-05**: User can see their current daily streak (consecutive study days)
- [ ] **PROF-06**: User streak resets if they miss a day

### Study Materials

- [ ] **MATL-01**: User can upload PDF files (with file size limit)
- [ ] **MATL-02**: User can upload plain text content
- [ ] **MATL-03**: System extracts text from uploaded PDFs automatically
- [ ] **MATL-04**: System detects topics from extracted text using AI
- [ ] **MATL-05**: User can review and select/deselect detected topics before generation
- [ ] **MATL-06**: User can view list of their uploaded materials
- [ ] **MATL-07**: User can request AI-generated summary of uploaded material
- [ ] **MATL-08**: System handles PDF extraction errors gracefully with clear messaging

### Question Generation

- [ ] **QGEN-01**: System generates MCQ questions from selected topics using OpenAI
- [ ] **QGEN-02**: System generates short answer questions from selected topics
- [ ] **QGEN-03**: System generates true/false questions from selected topics
- [ ] **QGEN-04**: Each question has a difficulty level (easy, medium, hard)
- [ ] **QGEN-05**: Each question includes: text, options (if MCQ), correct answer, explanation, topic tag
- [ ] **QGEN-06**: Questions are grounded in source material (not hallucinated from outside knowledge)
- [ ] **QGEN-07**: User's declared level influences default difficulty of generated questions
- [ ] **QGEN-08**: Generated questions are cached — same material + topic + difficulty does not regenerate

### Practice System

- [ ] **PRAC-01**: User can start a practice session from their materials
- [ ] **PRAC-02**: Questions are displayed one at a time
- [ ] **PRAC-03**: User can submit answer for each question
- [ ] **PRAC-04**: System checks MCQ and true/false answers by exact match
- [ ] **PRAC-05**: System evaluates short answer responses using AI (semantic evaluation, not string match)
- [ ] **PRAC-06**: User sees immediate feedback: correct/incorrect with explanation
- [ ] **PRAC-07**: User can choose practice mode: general (mixed topics) or weak-topic drill
- [ ] **PRAC-08**: Each attempt (question + answer + result) is stored in database

### Adaptive Learning

- [ ] **ADPT-01**: System tracks incorrect answers per topic per user
- [ ] **ADPT-02**: System maintains a weak topic list per user (topics with high error rate)
- [ ] **ADPT-03**: Weak topic drill mode generates questions specifically from weak topics
- [ ] **ADPT-04**: System tracks recent accuracy per topic (not just lifetime mistakes)
- [ ] **ADPT-05**: Topics can "graduate" from weak status when recent accuracy exceeds mastery threshold
- [ ] **ADPT-06**: New questions are generated for weak topics if existing pool is insufficient

### Analytics Dashboard

- [ ] **ANLT-01**: User can view total questions attempted
- [ ] **ANLT-02**: User can view correct vs incorrect count
- [ ] **ANLT-03**: User can view overall accuracy percentage
- [ ] **ANLT-04**: User can view weak topics list with per-topic accuracy
- [ ] **ANLT-05**: User can view per-topic accuracy breakdown in chart form
- [ ] **ANLT-06**: User can view progress over time (accuracy trend chart)
- [ ] **ANLT-07**: Dashboard loads fast with pre-aggregated data

### AI Tutor

- [ ] **TUTR-01**: User can ask AI to explain a topic conversationally
- [ ] **TUTR-02**: AI responses are grounded in user's uploaded materials (not generic)
- [ ] **TUTR-03**: Chat maintains conversation history within a session
- [ ] **TUTR-04**: User can ask follow-up questions ("explain more", "why is this wrong")

### UI/UX

- [ ] **UIUX-01**: Dark theme is the default appearance
- [ ] **UIUX-02**: User can toggle between dark and light themes
- [ ] **UIUX-03**: All pages are mobile responsive (usable on phone screens)
- [ ] **UIUX-04**: UI is clean, minimal, and distraction-free
- [ ] **UIUX-05**: Answer feedback is visually clear (green/red, explanation visible)
- [ ] **UIUX-06**: Loading states shown during AI operations (generation, evaluation)

### Additional Features

- [ ] **XTRA-01**: Pomodoro timer available during study sessions (configurable work/break intervals)
- [ ] **XTRA-02**: User can bookmark questions for later review
- [ ] **XTRA-03**: User can view all bookmarked questions in one place
- [ ] **XTRA-04**: User can create, edit, and delete personal notes
- [ ] **XTRA-05**: Notes are searchable

### Security

- [ ] **SECR-01**: All API endpoints validate input (reject malformed requests)
- [ ] **SECR-02**: API calls require valid JWT (except auth routes)
- [ ] **SECR-03**: File upload limited by type (PDF/text only) and size
- [ ] **SECR-04**: OpenAI API key is server-side only (never exposed to client)
- [ ] **SECR-05**: Rate limiting on auth endpoints (prevent brute force)
- [ ] **SECR-06**: Rate limiting on AI endpoints (prevent cost abuse)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social / Collaboration

- **SOCL-01**: User can share materials/question sets with others
- **SOCL-02**: Leaderboards for motivation

### Advanced Auth

- **AAUTH-01**: OAuth login (Google, GitHub)
- **AAUTH-02**: Two-factor authentication

### Content Expansion

- **CONT-01**: Video content support (transcription via Whisper API)
- **CONT-02**: User-authored custom questions
- **CONT-03**: Export study guides to PDF

### Advanced Learning

- **ADVL-01**: Spaced repetition scheduling (SRS)
- **ADVL-02**: Flashcard mode

### Platform

- **PLAT-01**: Admin/teacher dashboard
- **PLAT-02**: Offline mode / PWA
- **PLAT-03**: Mobile native app

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Solo-only by design — avoids WebSocket complexity |
| Leaderboards / gamification badges | Wrong incentives for a learning tool focused on weak areas |
| OAuth / third-party login | Email/password sufficient for v1 validation |
| Video content support | Storage/bandwidth costs, PDF/text covers 80% of study materials |
| Flashcard system | Active question practice > passive flashcards; dilutes core value |
| Spaced repetition (SRS) | Too complex; weak-topic tracking is a simpler proxy for v1 |
| Admin/teacher roles | Student-only platform for v1 |
| Offline / PWA | OpenAI API requires internet; web-only is fine |
| User-authored questions | AI generates all questions; users control input (materials) not output |
| Payment / subscription | Free for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 0
- Unmapped: 54

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after initial definition*
