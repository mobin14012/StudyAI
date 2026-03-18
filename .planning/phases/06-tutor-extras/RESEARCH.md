# Phase 6 Research: AI Tutor & Extras

## Overview

Phase 6 adds conversational AI tutor grounded in user materials, plus engagement features: Pomodoro timer, daily goals/streaks, bookmarks, and notes.

## Requirements Analysis

### AI Tutor (TUTR-01 to TUTR-04)
- **TUTR-01**: User can ask AI to explain a topic conversationally
- **TUTR-02**: AI responses are grounded in user's uploaded materials (not generic)
- **TUTR-03**: Chat maintains conversation history within a session
- **TUTR-04**: User can ask follow-up questions

### Engagement Features
- **XTRA-01**: Pomodoro timer (configurable work/break intervals)
- **XTRA-02**: User can bookmark questions
- **XTRA-03**: User can view all bookmarked questions
- **XTRA-04**: User can create, edit, delete notes
- **XTRA-05**: Notes are searchable

### Profile Goals (PROF-04 to PROF-06)
- **PROF-04**: User can set daily question goal
- **PROF-05**: User can see daily streak
- **PROF-06**: Streak resets on missed days

### Security (SECR-06)
- **SECR-06**: Rate limiting on AI endpoints

## Technical Decisions

### AI Tutor Architecture

**Chat Model:**
- Use OpenAI GPT-4o-mini for conversational responses
- System prompt includes selected material context
- Conversation history maintained in memory per session
- No persistent chat storage (sessions are ephemeral)

**Material Grounding:**
- When user selects a material, send truncated extracted text as context
- Instruct AI to only answer based on provided material
- If question is outside material scope, AI says "I don't see that in your materials"

**Session Management:**
- Chat sessions tied to a material
- Each message includes previous conversation for context
- Max ~10 messages in context window to avoid token limits
- Sessions clear on page navigation

### Pomodoro Timer

**Client-side Implementation:**
- Pure frontend component with useReducer for state
- Default: 25 min work, 5 min short break, 15 min long break
- Long break every 4 pomodoros
- Local storage for interval preferences
- Audio notification on timer complete (optional)

**No Backend Needed:**
- Timer is purely client-side
- No persistence required per requirements

### Bookmarks

**Model:**
```typescript
interface Bookmark {
  userId: ObjectId;
  questionId: ObjectId;
  createdAt: Date;
}
```

**API:**
- POST /api/bookmarks - Add bookmark
- DELETE /api/bookmarks/:questionId - Remove bookmark
- GET /api/bookmarks - List all bookmarks with populated questions

### Notes

**Model:**
```typescript
interface Note {
  userId: ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**API:**
- POST /api/notes - Create note
- GET /api/notes - List notes (with search query param)
- GET /api/notes/:id - Get single note
- PATCH /api/notes/:id - Update note
- DELETE /api/notes/:id - Delete note

**Search Implementation:**
- MongoDB text index on title + content
- Simple $text search for XTRA-05

### Daily Goals & Streaks

**User Model Extension:**
```typescript
// Add to User model
dailyGoal: number;          // Default: 0 (disabled)
lastActivityDate: Date;     // Last day with activity
currentStreak: number;      // Consecutive days
longestStreak: number;      // Personal best
```

**Streak Logic:**
- On each practice attempt, check lastActivityDate
- If today: no change
- If yesterday: increment streak
- If older: reset streak to 1
- Update lastActivityDate to today

**API:**
- PATCH /api/users/me - Update dailyGoal
- GET /api/users/me - Returns streak info (already exists)

### Rate Limiting (SECR-06)

**AI Endpoints to Protect:**
- POST /api/materials/:id/summary (already has some limits)
- POST /api/questions/generate
- POST /api/practice/submit (for AI evaluation)
- POST /api/tutor/chat (new)

**Implementation:**
- Use existing express-rate-limit middleware
- Create aiLimiter: 30 requests per minute per user
- Apply to all AI-consuming endpoints

## Plan Structure

### Plan 06-01: Backend AI Tutor + Rate Limiting
- Create tutor.service.ts (chat with material context)
- Create tutor.routes.ts (POST /chat)
- Create AI rate limiter middleware
- Apply rate limiter to AI endpoints

### Plan 06-02: Backend Extras (Bookmarks, Notes, Goals/Streaks)
- Create Bookmark model and routes
- Create Note model with text index and routes
- Update User model with goal/streak fields
- Create streak update logic in practice service

### Plan 06-03: Frontend UI
- Create TutorPage with chat interface
- Create PomodoroTimer component
- Create BookmarksPage
- Create NotesPage with create/edit/delete/search
- Update ProfilePage with goal setting and streak display
- Add bookmark toggle to practice questions

## File Changes Summary

### Server (Create)
- `server/src/services/tutor.service.ts`
- `server/src/routes/tutor.routes.ts`
- `server/src/models/Bookmark.ts`
- `server/src/models/Note.ts`
- `server/src/routes/bookmark.routes.ts`
- `server/src/routes/note.routes.ts`
- `server/src/middleware/ai-rate-limit.ts`
- `server/src/schemas/tutor.schemas.ts`
- `server/src/schemas/note.schemas.ts`

### Server (Modify)
- `server/src/app.ts` - Register new routes
- `server/src/models/User.ts` - Add goal/streak fields
- `server/src/services/practice.service.ts` - Update streak on attempt
- `server/src/routes/question.routes.ts` - Apply AI rate limit
- `server/src/routes/material.routes.ts` - Apply AI rate limit

### Client (Create)
- `client/src/pages/TutorPage.tsx`
- `client/src/pages/BookmarksPage.tsx`
- `client/src/pages/NotesPage.tsx`
- `client/src/components/tutor/ChatMessage.tsx`
- `client/src/components/tutor/ChatInput.tsx`
- `client/src/components/pomodoro/PomodoroTimer.tsx`
- `client/src/components/notes/NoteEditor.tsx`
- `client/src/api/tutor.ts`
- `client/src/api/bookmarks.ts`
- `client/src/api/notes.ts`
- `client/src/hooks/use-tutor.ts`
- `client/src/hooks/use-bookmarks.ts`
- `client/src/hooks/use-notes.ts`
- `client/src/hooks/use-pomodoro.ts`

### Client (Modify)
- `client/src/types/index.ts` - Add types
- `client/src/App.tsx` - Add routes
- `client/src/components/layout/Sidebar.tsx` - Add nav items
- `client/src/pages/ProfilePage.tsx` - Add goals/streak section
- `client/src/components/practice/QuestionDisplay.tsx` - Add bookmark button

## Dependencies

No new dependencies required:
- OpenAI already installed for AI features
- express-rate-limit already installed for rate limiting
- Lucide icons for bookmark/timer icons

---
*Research completed: 2026-03-18*
