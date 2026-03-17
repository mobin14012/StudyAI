---
phase: 02
slug: upload-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + build commands (no test framework in v1) |
| **Config file** | none |
| **Quick run command** | `cd client && npx vite build` |
| **Full suite command** | `cd server && npx tsc --noEmit && cd ../client && npx vite build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npx vite build`
- **After every plan wave:** Run full suite (server tsc + client build)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | MATL-01, MATL-02 | build | `cd server && npx tsc --noEmit` | ⬜ pending |
| 02-01-02 | 01 | 1 | MATL-03 | build | `cd server && npx tsc --noEmit` | ⬜ pending |
| 02-01-03 | 01 | 1 | MATL-04, MATL-07 | build | `cd server && npx tsc --noEmit` | ⬜ pending |
| 02-01-04 | 01 | 1 | MATL-05, MATL-06, MATL-08 | build | `cd server && npx tsc --noEmit` | ⬜ pending |
| 02-02-01 | 02 | 1 | MATL-01, MATL-02 | build | `cd client && npx vite build` | ⬜ pending |
| 02-02-02 | 02 | 1 | MATL-05, MATL-06 | build | `cd client && npx vite build` | ⬜ pending |
| 02-02-03 | 02 | 1 | MATL-07 | build | `cd client && npx vite build` | ⬜ pending |
| 02-03-01 | 03 | 2 | ALL | integration | full suite | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed.

Server TypeScript compilation (`npx tsc --noEmit`) and client Vite build serve as automated verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF text extraction produces correct content | MATL-03 | Requires real PDF file + visual inspection | Upload a known PDF, verify extractedText matches expected content |
| AI topic detection returns relevant topics | MATL-04 | Requires OpenAI API key + subjective quality check | Upload educational material, verify topics are relevant to content |
| AI summary is coherent and accurate | MATL-07 | Requires OpenAI API key + subjective quality check | Request summary, verify it covers key points of material |
| Drag-and-drop upload works on desktop | MATL-01 | Browser interaction | Drag PDF file onto upload zone, verify upload starts |
| Upload progress indicators display correctly | MATL-01 | Visual inspection | Upload a file, verify progress bar/spinner shows during processing |
| Topic checkboxes toggle correctly | MATL-05 | Browser interaction | Click checkboxes, verify state changes, save and reload |
| Error messages are user-friendly | MATL-08 | Subjective quality | Upload corrupted PDF, verify error message is clear and actionable |
| Mobile responsiveness | UIUX-02 | Visual inspection | Resize browser, verify all material pages render correctly |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
