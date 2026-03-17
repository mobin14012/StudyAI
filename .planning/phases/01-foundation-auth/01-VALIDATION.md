---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke tests (no automated test framework in Phase 1) |
| **Config file** | none |
| **Quick run command** | `npm run dev` (verify server + client start without errors) |
| **Full suite command** | Run 14-step smoke test sequence below |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Run `npm run dev` — verify no startup errors
- **After every plan wave:** Run full smoke test sequence
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (server start + page load)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification Method | Status |
|---------|------|------|-------------|-----------|---------------------|--------|
| 01-01-01 | 01 | 1 | SECR-04 | manual | Build client, search dist/ for "sk-" or "openai" — zero matches. No `VITE_OPENAI_*` in client .env | ⬜ pending |
| 01-02-01 | 02 | 2 | AUTH-01, AUTH-02, SECR-01 | manual | POST `/api/auth/register` → 201 with user object. DB passwordHash starts with `$2a$`/`$2b$`. Malformed body → 400 | ⬜ pending |
| 01-02-02 | 02 | 2 | AUTH-03, AUTH-04, AUTH-05, AUTH-06, SECR-02, SECR-05 | manual | Login → JWT access token. Refresh → new tokens, old invalidated. Logout → cookie cleared. Wrong creds → "Invalid email or password". 11 rapid logins → 429. Protected routes → 401 without token | ⬜ pending |
| 01-03-01 | 03 | 2 | UIUX-01, UIUX-02, UIUX-04 | manual | First visit → dark theme. Toggle → light. Refresh preserves. shadcn/ui consistent styling | ⬜ pending |
| 01-03-02 | 03 | 2 | UIUX-03, UIUX-06 | manual | 375px width — no overflow, touch targets ≥44px. Loading spinner on auth operations, skeleton on profile | ⬜ pending |
| 01-04-01 | 04 | 3 | PROF-01, SECR-03 | manual | Register form has level selector. Upload config file exists with PDF/text + 10MB limits | ⬜ pending |
| 01-04-02 | 04 | 3 | PROF-02, PROF-03, SECR-06 | manual | Profile page: change level → PATCH succeeds. Progress page → empty state message. aiLimiter exported (30 req/hour) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No automated test framework in Phase 1. All verification is manual smoke testing via curl/browser.*

*Existing infrastructure covers all phase requirements through manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark theme default | UIUX-01 | Visual — requires browser | First visit with no localStorage: verify dark background, light text |
| Theme toggle persistence | UIUX-02 | Visual + localStorage | Toggle theme, refresh, verify persists |
| Mobile responsive | UIUX-03 | Visual — viewport testing | Resize to 375px, check all pages for overflow |
| Clean minimal UI | UIUX-04 | Subjective visual review | Check consistent spacing, hierarchy, no clutter |
| Loading states | UIUX-06 | Visual timing-dependent | Login/register with slow network: verify spinner shown |
| Session persistence | AUTH-04 | Requires browser cookie state | Login, close tab, reopen — session restored via silent refresh |
| Logout from any page | AUTH-05 | Requires full browser flow | Navigate to /profile, click logout, verify redirect to /login |
| Error messages clarity | AUTH-06 | Requires visual review of UI messages | Wrong password → toast with clear message, no email enumeration |

---

## Quick Smoke Test Sequence

After Phase 1 is complete, run this sequence to verify all 21 requirements:

1. Start server (`npm run dev:server`) — connects to MongoDB successfully
2. Start client (`npm run dev:client`) — opens on localhost:5173 with dark theme
3. Visit `/login` — redirected because not authenticated, login form renders
4. Visit `/register` — registration form with email, password, name, level fields
5. Register with valid data — redirected to dashboard, sees user name in header
6. Refresh page — session persists (silent refresh works)
7. Toggle theme — switches to light, refresh preserves choice
8. Visit `/profile` — sees current name and level, can change level to "senior"
9. Visit `/progress` — sees empty state placeholder message
10. Resize browser to 375px — all pages responsive, no overflow
11. Click logout — redirected to login, refresh token cleared
12. Try to visit `/` — redirected to login (protected route)
13. Attempt 11 rapid logins — 429 rate limit response on attempt 11
14. Send malformed POST to `/api/auth/register` — 400 with validation details

---

## Validation Sign-Off

- [ ] All tasks have manual verification methods defined
- [ ] Sampling continuity: smoke tests after each wave
- [ ] Quick smoke sequence covers all 21 requirements
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter after verification

**Approval:** pending
