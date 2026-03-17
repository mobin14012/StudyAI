# Stack Research

**Domain:** AI-Powered Personalized Study Web Application
**Researched:** 2026-03-17
**Confidence:** HIGH
**Pre-Selected Core:** React + Node.js/Express + MongoDB + OpenAI API

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| React | ^19.0 | Frontend UI framework | Pre-selected. v19 is stable with concurrent features, automatic batching, and improved Suspense. No reason to use 18 for a greenfield project. | HIGH |
| Node.js | ^20 LTS | Server runtime | Pre-selected. v20 LTS is the production-grade choice — native fetch, stable test runner, performance improvements. v22 LTS is also viable but 20 has the longest remaining support window. | HIGH |
| Express | ^4.21 | HTTP server framework | Pre-selected. v4 is battle-tested. Express v5 is still fresh in production adoption — stick with v4 for ecosystem maturity. Migrate to v5 later when middleware ecosystem catches up. | HIGH |
| MongoDB | ^7.0 | Database | Pre-selected. v7 has improved queryable encryption and better aggregation. Use MongoDB Atlas for managed hosting. | HIGH |
| OpenAI SDK | ^4.77 | AI integration | Pre-selected. Official Node.js SDK. v4 has streaming, function calling, structured outputs, and proper TypeScript types. | HIGH |

---

## Frontend Stack

### Build Tool & Project Setup

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Vite | ^6.2 | Build tool / dev server | Sub-second HMR, native ESM, orders of magnitude faster than CRA or Webpack. The standard for new React projects in 2025+. | HIGH |
| TypeScript | ^5.7 | Type safety | Non-negotiable for any production app. Catches bugs at compile time, improves DX with IntelliSense, makes refactoring safe. | HIGH |

### Routing

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| React Router | ^7.3 | Client-side routing | Industry standard for React SPAs. v7 merged with Remix, has loaders/actions for data fetching, nested layouts, and type-safe route params. Covers all pages: Login, Dashboard, Practice, Upload, Analytics. | HIGH |

### State Management

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Zustand | ^5.0 | Global client state | Minimal boilerplate, tiny bundle (~1KB), intuitive API. Perfect for UI state like theme toggle (dark/light), sidebar state, timer state (Pomodoro), modal state. No providers needed. | HIGH |
| TanStack Query (React Query) | ^5.67 | Server state management | Handles all API data fetching, caching, background refetching, optimistic updates. Critical for: question loading, analytics data, material lists, user profile. Separates server state from UI state cleanly. | HIGH |

### UI Components & Styling

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Tailwind CSS | ^4.0 | Utility-first CSS | Fastest way to build dark-first, responsive UIs. v4 has automatic content detection, native CSS cascade layers, improved performance. Perfect for the "clean/minimal/professional" requirement. | HIGH |
| shadcn/ui | latest (copy-paste) | Component library | Not an npm package — copies components into your codebase. Built on Radix UI primitives (accessible). Fully customizable, dark mode native, professional look. Provides: buttons, inputs, dialogs, dropdowns, cards, tabs, toasts. | HIGH |
| Lucide React | ^0.475 | Icons | Tree-shakeable, consistent icon set. Used by shadcn/ui natively. | HIGH |
| clsx | ^2.1 | Conditional classes | Tiny utility for combining Tailwind classes conditionally. | HIGH |
| tailwind-merge | ^3.0 | Class merging | Resolves Tailwind class conflicts intelligently. Used with clsx via a `cn()` utility. | HIGH |

### Form Handling

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| React Hook Form | ^7.54 | Form management | Minimal re-renders (uncontrolled inputs by default), tiny bundle, great DX. Handles: login/register forms, profile editing, goal setting, note creation. | HIGH |
| Zod | ^3.24 | Schema validation | TypeScript-first validation. Share schemas between frontend and backend. Validates: form inputs, API request/response shapes. Pairs with React Hook Form via `@hookform/resolvers`. | HIGH |
| @hookform/resolvers | ^4.1 | RHF + Zod bridge | Connects Zod schemas to React Hook Form for declarative validation. | HIGH |

### Charts & Analytics

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Recharts | ^2.15 | Analytics charts | Built on D3 but with React components. Easy to create: line charts (progress over time), bar charts (topic accuracy), pie charts (question type distribution), area charts (streaks). Responsive out of the box. | HIGH |

### File Upload

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| react-dropzone | ^14.3 | Drag & drop file upload | Lightweight, accessible, handles drag-and-drop + click-to-upload. Perfect for the PDF/text upload flow. | HIGH |

### Miscellaneous Frontend

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| react-hot-toast / sonner | ^2.5 / ^2.0 | Toast notifications | Sonner preferred — more modern, animated, stackable. For: "Question bookmarked", "Upload complete", "Session saved". | MEDIUM |
| date-fns | ^4.1 | Date formatting | Lightweight, tree-shakeable. For: streak tracking, session timestamps, "last studied X ago". | HIGH |
| react-markdown | ^10.1 | Markdown rendering | AI responses (explanations, summaries) often contain markdown. Renders them properly in the chat tutor UI. | HIGH |

---

## Backend Stack

### Server Framework & Middleware

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Express | ^4.21 | HTTP framework | Pre-selected. Mature, massive ecosystem. | HIGH |
| cors | ^2.8 | CORS handling | Required for frontend-backend communication across origins (Vercel <-> Render). | HIGH |
| helmet | ^8.0 | Security headers | Sets security HTTP headers automatically (CSP, HSTS, X-Frame-Options). Non-negotiable for production. | HIGH |
| morgan | ^1.10 | HTTP logging | Request logging for debugging and monitoring. Use 'dev' format locally, 'combined' in production. | HIGH |
| compression | ^1.7 | Response compression | Gzip/brotli compression for API responses. Reduces payload sizes for analytics data and question batches. | HIGH |
| express-rate-limit | ^7.5 | Rate limiting | Prevent API abuse, especially on OpenAI-calling endpoints (expensive). Set per-endpoint limits. | HIGH |
| express-validator | ^7.2 | Input validation | OR use Zod on backend too (see below). express-validator is Express-native but Zod allows schema sharing with frontend. | MEDIUM |
| Zod | ^3.24 | Backend validation (shared) | Same library as frontend. Share validation schemas between client and server. Single source of truth for data shapes. Preferred over express-validator for this reason. | HIGH |

### Authentication

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| jsonwebtoken | ^9.0 | JWT creation/verification | Industry standard for JWT auth. Create access + refresh token pairs. | HIGH |
| bcryptjs | ^2.4 | Password hashing | Pure JS bcrypt implementation. Hash passwords with salt rounds (12 recommended). Use bcryptjs over bcrypt — no native compilation issues on deployment. | HIGH |
| cookie-parser | ^1.4 | Cookie parsing | If using httpOnly cookies for refresh tokens (recommended over localStorage for security). | MEDIUM |

### File Upload & PDF Processing

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| multer | ^1.4 | File upload middleware | Standard Express file upload handling. Handles multipart/form-data. Configure file size limits (e.g., 10MB for PDFs). | HIGH |
| pdf-parse | ^1.1 | PDF text extraction | Extracts text content from uploaded PDFs. Lightweight, works server-side. Sufficient for text-heavy academic PDFs. | MEDIUM |
| pdf.js-extract | ^0.2 | PDF extraction (alternative) | Better for complex PDFs with tables/columns. Consider if pdf-parse results are poor quality. | LOW |

### Database & ODM

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| Mongoose | ^8.12 | MongoDB ODM | Schema validation, middleware hooks, population (joins), TypeScript support. Defines schemas for: Users, Materials, Questions, Attempts, WeakTopics. v8 has better TS integration and improved query performance. | HIGH |

### AI Integration

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| openai | ^4.77 | OpenAI API SDK | Official SDK. Structured outputs (JSON mode) for question generation. Streaming for chat tutor. Function calling for structured evaluation. | HIGH |
| tiktoken | ^1.0 | Token counting | Count tokens before sending to OpenAI to stay within context limits and estimate costs. Critical for long study materials. | HIGH |

### Utilities

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| dotenv | ^16.4 | Environment variables | Load .env files for API keys, DB connection strings, JWT secrets. | HIGH |
| winston | ^3.17 | Logging | Structured, leveled logging. Better than console.log for production. Log to files + console. | MEDIUM |
| nanoid | ^5.0 | ID generation | Short, URL-friendly unique IDs. Useful for shareable question set links or session IDs. | LOW |

---

## Development Tools

### Testing

| Tool | Version | Purpose | Notes | Confidence |
|------|---------|---------|-------|------------|
| Vitest | ^3.0 | Unit/integration testing | Native Vite integration, Jest-compatible API, faster than Jest. Test: utility functions, Zod schemas, React hooks, API handlers. | HIGH |
| React Testing Library | ^16.2 | Component testing | Test components by user behavior, not implementation. Test: form submissions, navigation, conditional rendering. | HIGH |
| MSW (Mock Service Worker) | ^2.7 | API mocking | Intercept network requests in tests. Mock OpenAI responses, auth endpoints. Works in both browser and Node. | HIGH |
| Supertest | ^7.0 | API endpoint testing | Test Express routes directly without starting server. Test: auth flow, file upload, question CRUD. | HIGH |
| Playwright | ^1.50 | E2E testing | Cross-browser E2E tests. Test: full login flow, upload-to-question flow, practice sessions. Add later — not needed for v1 MVP. | LOW |

### Linting & Formatting

| Tool | Version | Purpose | Notes | Confidence |
|------|---------|---------|-------|------------|
| ESLint | ^9.19 | Linting | v9 flat config format. Use with TypeScript parser. Catches bugs and enforces consistency. | HIGH |
| Prettier | ^3.4 | Code formatting | Opinionated formatter. End all style debates. Configure: single quotes, trailing commas, 2-space indent. | HIGH |
| eslint-config-prettier | ^10.0 | ESLint + Prettier compat | Disables ESLint rules that conflict with Prettier. | HIGH |

### Other Dev Tools

| Tool | Version | Purpose | Notes | Confidence |
|------|---------|---------|-------|------------|
| tsx | ^4.19 | TS execution for Node | Run TypeScript backend directly without compilation step during development. Faster than ts-node. | HIGH |
| nodemon | ^3.1 | Auto-restart server | Watch for file changes, restart Express server automatically. Pair with tsx. | HIGH |
| concurrently | ^9.1 | Run multiple scripts | Run frontend dev server + backend dev server simultaneously from root. | MEDIUM |

---

## Installation Commands

```bash
# ============================================
# FRONTEND (from /client directory)
# ============================================

# Project setup
npm create vite@latest client -- --template react-ts

# Core
npm install react-router-dom@^7.3 zustand@^5.0 @tanstack/react-query@^5.67

# UI & Styling
npm install tailwindcss@^4.0 @tailwindcss/vite@^4.0
npx shadcn@latest init
npm install lucide-react clsx tailwind-merge

# Forms & Validation
npm install react-hook-form@^7.54 zod@^3.24 @hookform/resolvers@^4.1

# Charts & Data Display
npm install recharts@^2.15

# File Upload
npm install react-dropzone@^14.3

# Utilities
npm install sonner@^2.0 date-fns@^4.1 react-markdown@^10.1 axios@^1.7

# Dev dependencies
npm install -D vitest@^3.0 @testing-library/react@^16.2 @testing-library/jest-dom@^6.6 msw@^2.7 @types/react @types/react-dom eslint@^9.19 prettier@^3.4 eslint-config-prettier@^10.0 @vitejs/plugin-react@^4.3

# ============================================
# BACKEND (from /server directory)
# ============================================

# Core
npm install express@^4.21 mongoose@^8.12 openai@^4.77

# Middleware & Security
npm install cors@^2.8 helmet@^8.0 morgan@^1.10 compression@^1.7 express-rate-limit@^7.5 cookie-parser@^1.4

# Auth
npm install jsonwebtoken@^9.0 bcryptjs@^2.4

# File Processing
npm install multer@^1.4 pdf-parse@^1.1

# Validation (shared with frontend)
npm install zod@^3.24

# AI
npm install tiktoken@^1.0

# Utilities
npm install dotenv@^16.4 winston@^3.17 nanoid@^5.0

# Dev dependencies
npm install -D typescript@^5.7 tsx@^4.19 nodemon@^3.1 vitest@^3.0 supertest@^7.0 @types/express @types/cors @types/morgan @types/compression @types/cookie-parser @types/jsonwebtoken @types/bcryptjs @types/multer @types/supertest eslint@^9.19 prettier@^3.4

# ============================================
# ROOT (monorepo coordination)
# ============================================
npm install -D concurrently@^9.1
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Redux Toolkit | If team already knows Redux, or if you need Redux DevTools time-travel debugging. Zustand is simpler for this app's state needs. |
| Zustand | Jotai | If you prefer atomic state (bottom-up). Good for highly granular state. Zustand is better for this app's few global stores. |
| TanStack Query | SWR | SWR is simpler but has fewer features (no mutation tracking, less powerful cache invalidation). TanStack Query is more capable for complex data flows. |
| Tailwind CSS | CSS Modules | If team dislikes utility CSS. CSS Modules provide scoping without a utility framework but slower to build UIs. |
| shadcn/ui | Material UI (MUI) | If you want a fully opinionated design system out of the box. MUI is heavier, harder to customize for dark-first themes, and has larger bundle size. |
| shadcn/ui | Ant Design | If building enterprise/admin-heavy UI. Overkill for a student-facing study app. Heavy bundle. |
| Recharts | Chart.js (react-chartjs-2) | If you need canvas-based rendering for very large datasets. Recharts (SVG) is better for the moderate data sizes in analytics dashboards. |
| React Router v7 | TanStack Router | If you want 100% type-safe routing. TanStack Router is excellent but newer, smaller ecosystem. React Router v7 is safer for production. |
| Vite | Next.js | If you need SSR, ISR, or SEO for public pages. This app is behind auth — pure SPA is fine. Next.js adds unnecessary complexity here. |
| Vitest | Jest | If the project used Webpack/CRA. With Vite, Vitest is the natural and faster choice. No reason to use Jest with Vite. |
| pdf-parse | LangChain document loaders | If you later need multi-format ingestion (DOCX, HTML, etc.). For PDF-only, pdf-parse is lighter and simpler. |
| Zod (backend) | express-validator | If you strongly prefer Express-native middleware-style validation. Zod wins because schemas are shareable with frontend. |
| bcryptjs | bcrypt | If you need maximum hashing speed (bcrypt uses native C++ bindings). bcryptjs avoids native compilation headaches on Render/Railway. |
| tsx | ts-node | ts-node works but is slower and has more configuration quirks. tsx uses esbuild under the hood and just works. |
| winston | pino | Pino is faster (JSON-first logging). Use if you need high-throughput structured logs. Winston is more flexible with transports and formatting. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially deprecated. Extremely slow builds, unmaintained, no ESM support. | Vite |
| Redux (vanilla) | Massive boilerplate, complex for simple state. Even Redux Toolkit is overkill for this app's UI state needs. | Zustand |
| Moment.js | Deprecated by its own maintainers. Massive bundle (300KB+), mutable API. | date-fns |
| Axios interceptors for auth | Complex, error-prone. TanStack Query handles retry/refetch natively. Use Axios for HTTP calls but not for auth state management. | TanStack Query + simple Axios instance |
| localStorage for JWT tokens | XSS-vulnerable. Any injected script can steal tokens. | httpOnly cookies for refresh tokens, in-memory for access tokens |
| Passport.js | Massive abstraction for simple JWT auth. Adds unnecessary complexity and middleware layers. You only need jsonwebtoken + bcryptjs. | jsonwebtoken + bcryptjs directly |
| Mongoose `autoIndex` in production | Creates indexes on every app restart. Degrades performance. | Create indexes manually or in migration scripts |
| `any` type in TypeScript | Defeats the entire purpose of TypeScript. | Proper types, `unknown` if truly needed, Zod inference for API types |
| Bootstrap / jQuery | Legacy approach. Bootstrap fights against custom dark themes. jQuery is unnecessary with React. | Tailwind CSS + shadcn/ui |
| express-session | Project requirement is JWT-based auth. Session-based auth needs server-side storage, doesn't scale as cleanly with stateless APIs. | JWT (jsonwebtoken) |
| Webpack | Slower than Vite by 10-20x in dev. Complex configuration. No advantage for new projects. | Vite |
| dotenv in frontend | Vite has built-in env variable handling via `import.meta.env`. Don't add dotenv to the client. | Vite's built-in `.env` support |

---

## Architecture Patterns

**Monorepo Structure (Recommended):**
```
study-app/
  client/          # React + Vite
  server/          # Express + TypeScript
  shared/          # Shared Zod schemas, types, constants
  package.json     # Root scripts (concurrently)
```
- Shared Zod schemas between frontend and backend eliminate type drift
- Single git repo, single PR for full-stack changes

**API Client Pattern:**
- Create a typed API client using Axios + Zod response parsing
- TanStack Query wraps the API client for caching/state
- Never call fetch/axios directly from components

**Auth Flow:**
- Access token (short-lived, 15min) stored in memory (React state/Zustand)
- Refresh token (long-lived, 7d) stored in httpOnly secure cookie
- Silent refresh on app load and before token expiry
- Axios interceptor for attaching access token to requests

**OpenAI Integration Pattern:**
- Never call OpenAI from the frontend directly (leaks API key)
- Backend service layer wraps all OpenAI calls
- Use structured outputs (JSON mode / response_format) for question generation
- Use streaming for chat tutor responses
- Implement retry with exponential backoff for rate limits
- Cache generated questions in MongoDB to avoid regenerating

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React ^19.0 | React Router ^7.3 | v7 fully supports React 19 |
| React ^19.0 | @tanstack/react-query ^5.67 | v5 supports React 19 concurrent features |
| React ^19.0 | React Hook Form ^7.54 | Compatible, v7 works with React 19 |
| Vite ^6.2 | Vitest ^3.0 | Share vite.config.ts, same plugin ecosystem |
| Vite ^6.2 | Tailwind ^4.0 | Use @tailwindcss/vite plugin, native integration |
| Mongoose ^8.12 | MongoDB ^7.0 | Mongoose 8 requires MongoDB driver ^6.0, supports MongoDB 7 features |
| Express ^4.21 | multer ^1.4 | Stable pairing, both use multipart/form-data |
| TypeScript ^5.7 | Zod ^3.24 | Full type inference support |
| shadcn/ui | Tailwind ^4.0 | shadcn updated for Tailwind v4 compatibility |
| ESLint ^9.19 | Flat config required | v9 uses `eslint.config.js` (not `.eslintrc`) |

---

## Cost Considerations

| Service | Free Tier | Estimated Monthly Cost (v1) |
|---------|-----------|---------------------------|
| MongoDB Atlas | 512MB free cluster | $0 (free tier sufficient for MVP) |
| Vercel | 100GB bandwidth, 100 deployments | $0 (hobby plan) |
| Render | 750 hours free | $0 (free tier, spins down on inactivity) |
| OpenAI API (gpt-4o-mini) | None | ~$5-20 depending on usage |
| OpenAI API (gpt-4o) | None | ~$20-100 depending on usage |

**Recommendation:** Start with `gpt-4o-mini` for question generation (cheaper, still capable). Use `gpt-4o` only for complex answer evaluation or chat tutoring where quality matters more.

---

## Sources

- React 19 official blog — confirmed stable release and feature set
- Vite 6 release notes — verified Tailwind v4 plugin and React 19 support
- TanStack Query docs — verified v5 API and React 19 compatibility
- shadcn/ui docs — confirmed Tailwind v4 support and component list
- OpenAI Node SDK changelog — verified v4 structured outputs and streaming
- Mongoose 8 migration guide — confirmed TypeScript improvements and MongoDB 7 support
- Express.js docs — verified v4 stability and v5 status
- npm registry — version numbers verified against latest published versions as of 2026-03

---
*Stack research for: AI-Powered Personalized Study Web Application*
*Researched: 2026-03-17*
