# StudyAI

## What This Is

A full-stack AI-powered personalized study web application where students upload their study materials (PDFs/text), and the system uses AI to generate targeted practice questions, evaluate answers intelligently, detect weak areas, and continuously adapt sessions. It behaves like an intelligent tutor that meets each student where they are.

## Core Value

Students improve their weak areas through AI-driven adaptive practice — the system identifies what you're bad at and hammers it until you're not.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Secure user authentication (JWT, hashed passwords, registration/login)
- [ ] User profiles with self-declared level (junior/senior), progress tracking
- [ ] Study material upload (PDF/text) with text extraction and AI topic detection
- [ ] Upload → review extracted topics → generate questions flow
- [ ] AI question generation (MCQ, short answer, true/false) with 3 difficulty levels
- [ ] Each question includes: text, options (if MCQ), correct answer, explanation, topic tag
- [ ] Full AI tutor capabilities: question generation, smart answer evaluation, material summaries, chat-style explanations
- [ ] Practice system showing questions one-by-one with immediate feedback
- [ ] Adaptive learning engine with user-chosen modes: general practice vs weak-topic drills
- [ ] Weak topic tracking per user (incorrect answers increase topic mistake count)
- [ ] Analytics dashboard: attempts, accuracy, weak topics, progress over time
- [ ] React frontend: dark-first design, mobile responsive, clean/minimal/professional
- [ ] Pages: Login/Register, Dashboard, Practice, Material Upload, Analytics
- [ ] Pomodoro timer for study sessions
- [ ] Daily streak tracking
- [ ] Goal setting (questions per day)
- [ ] Bookmark questions
- [ ] Notes section
- [ ] Input validation and secure API calls
- [ ] Node.js/Express backend with REST API
- [ ] MongoDB database (Users, Materials, Questions, Attempts, WeakTopics collections)

### Out of Scope

- Real-time collaboration / social features — solo-only experience by design
- Leaderboards / competitive features — contradicts focused solo learning
- OAuth / third-party login — email/password sufficient for v1
- Mobile native app — web-first, responsive design covers mobile
- Video content support — text/PDF only for v1
- Admin/teacher roles — student-only platform for v1
- Payment / subscription system — free for v1

## Context

- **Stack**: React (frontend) + Node.js/Express (backend) + MongoDB (database)
- **AI**: OpenAI API for question generation, answer evaluation, summaries, chat tutoring
- **Upload flow**: Student uploads PDF → reviews extracted topics → selects what to generate from
- **Practice modes**: General practice (mixed topics) and focused weak-topic drills (user chooses)
- **Levels**: Self-declared during signup (junior/senior), can change later
- **UI**: Dark theme by default with light mode toggle, distraction-free, fast loading
- **Deployment target**: Vercel (frontend), Render/Railway (backend), MongoDB Atlas (database)

## Constraints

- **Tech Stack**: React + Node.js/Express + MongoDB — chosen by project owner
- **AI Provider**: OpenAI API — required for question generation and tutoring features
- **Authentication**: JWT-based — no session-based auth
- **Design**: Dark-first, mobile responsive — non-negotiable UX requirement
- **Experience**: Solo only — no multi-user interaction features

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Upload → Review → Generate flow | Gives students control over what gets generated from their materials | — Pending |
| User chooses practice mode (general vs drill) | Balances flexibility — some students want targeted drilling, others want variety | — Pending |
| Full AI tutor (not just question gen) | Maximizes value of OpenAI integration — smart answer eval, summaries, chat | — Pending |
| Self-declared student level | Simplest onboarding — no complex assessment needed upfront | — Pending |
| Dark-first UI | Matches student study habits (often studying at night) | — Pending |
| Solo-only experience | Keeps scope focused, avoids social feature complexity | — Pending |
| MongoDB over SQL | Flexible schema suits varying question types and user data shapes | — Pending |

---
*Last updated: 2026-03-17 after initialization*
