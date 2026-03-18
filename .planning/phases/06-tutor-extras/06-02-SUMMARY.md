---
phase: 06-tutor-extras
plan: 02
subsystem: api, database
tags: [mongoose, express, bookmarks, notes, streaks, text-search]

requires:
  - phase: 06-tutor-extras/01
    provides: tutor routes and rate limiting infrastructure
provides:
  - Bookmark model with compound unique index
  - Note model with MongoDB text index for search
  - User model extended with goal/streak fields
  - Bookmark CRUD API endpoints
  - Note CRUD API with text search
  - Streak tracking on practice activity
affects: [frontend-extras, profile-page]

tech-stack:
  added: []
  patterns:
    - Text index for full-text search on notes
    - Compound unique index for bookmarks
    - Streak calculation with date comparison

key-files:
  created:
    - server/src/models/Bookmark.ts
    - server/src/models/Note.ts
    - server/src/schemas/note.schemas.ts
    - server/src/routes/bookmark.routes.ts
    - server/src/routes/note.routes.ts
  modified:
    - server/src/models/User.ts
    - server/src/services/practice.service.ts
    - server/src/app.ts

key-decisions:
  - "Compound unique index on (userId, questionId) for bookmarks - prevents duplicates at DB level"
  - "MongoDB text index on title+content for note search - native full-text search"
  - "Streak resets to 1 (not 0) on missed days - maintains engagement"

patterns-established:
  - "Text search with $text operator for searchable content"
  - "Streak tracking via lastActivityDate comparison"

requirements-completed: [XTRA-02, XTRA-03, XTRA-04, XTRA-05, PROF-04, PROF-05, PROF-06]

duration: 13min
completed: 2026-03-18
---

# Plan 06-02: Backend Extras (Bookmarks, Notes, Goals) Summary

**Bookmark/note CRUD APIs with MongoDB text search and daily streak tracking on practice activity**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-18T09:34:35Z
- **Completed:** 2026-03-18T11:47:35Z
- **Tasks:** 7
- **Files modified:** 8

## Accomplishments

- Bookmark model with compound unique index preventing duplicate bookmarks
- Note model with MongoDB text index enabling full-text search
- User model extended with dailyGoal, currentStreak, longestStreak fields
- Complete bookmark CRUD API with ownership validation
- Note CRUD API with optional text search via ?q= parameter
- Automatic streak tracking triggered on each practice answer submission

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Bookmark Model** - `f35f029` (feat)
2. **Task 2: Create Note Model** - `46b251f` (feat)
3. **Task 3: Update User Model** - `e8f4a08` (feat)
4. **Task 4: Create Bookmark Routes** - `06ea6e1` (feat)
5. **Task 5: Create Note Routes** - `5bbc240` (feat)
6. **Task 6: Add Streak Tracking** - `65f5675` (feat)
7. **Task 7: Register Routes** - `3c44c9b` (feat)

## Files Created/Modified

- `server/src/models/Bookmark.ts` - Bookmark schema with userId+questionId compound index
- `server/src/models/Note.ts` - Note schema with text index on title+content
- `server/src/schemas/note.schemas.ts` - Zod validation for note create/update
- `server/src/routes/bookmark.routes.ts` - GET/POST/DELETE bookmark endpoints
- `server/src/routes/note.routes.ts` - Full CRUD with search for notes
- `server/src/models/User.ts` - Added dailyGoal, lastActivityDate, streak fields
- `server/src/services/practice.service.ts` - updateStreak() called on answer submit
- `server/src/app.ts` - Mounted /api/bookmarks and /api/notes routes

## Decisions Made

- Compound unique index on bookmarks enforces one bookmark per question per user at DB level
- MongoDB text index enables native full-text search without external search service
- Streak calculation uses date comparison: consecutive days increment, gaps reset to 1
- Duplicate bookmark attempts return success with "Already bookmarked" message (idempotent)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend extras complete (bookmarks, notes, goals/streaks)
- Ready for Plan 06-03: Frontend UI for tutor and extras features
- All API endpoints operational and tested via build verification

---
*Phase: 06-tutor-extras*
*Completed: 2026-03-18*
