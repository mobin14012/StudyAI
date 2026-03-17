# Phase 1 Research: Foundation & Auth

**Phase:** 1 — Foundation & Auth
**Researched:** 2026-03-17
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, PROF-01, PROF-02, PROF-03, UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-06, SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06

---

## 1. Implementation Patterns

### 1.1 Project Scaffold

**Monorepo layout** — two independent npm projects (`client/` and `server/`) coordinated by a root `package.json` with `concurrently`. No workspace tooling (npm workspaces, turborepo) needed at this scale.

- Root `package.json` contains only `devDependencies: { concurrently }` and scripts to run both projects.
- Shared Zod schemas are duplicated for now (one copy in `client/src/schemas/`, one in `server/src/schemas/`). A `shared/` package can be extracted later if drift becomes a problem, but adds monorepo tooling overhead for Phase 1.
- TypeScript is configured independently in each project (`client/tsconfig.json`, `server/tsconfig.json`).

### 1.2 Auth System Pattern

**Three-layer architecture:**

1. **Route layer** (`server/src/routes/auth.routes.ts`) — HTTP concerns only: parse request, call service, send response, set cookies.
2. **Service layer** (`server/src/services/auth.service.ts`) — business logic: hash password, verify credentials, generate tokens, rotate refresh tokens.
3. **Model layer** (`server/src/models/User.ts`) — data access: Mongoose schema, indexes, instance methods.

**Token strategy:**
- Access token: short-lived JWT (15 min), stored in memory on the client (Zustand store). Sent via `Authorization: Bearer <token>` header.
- Refresh token: long-lived opaque token (7 days), stored in httpOnly secure cookie. Sent automatically by the browser. Used only to obtain new access tokens.
- Refresh token rotation: every time a refresh token is used, it is invalidated and a new one is issued. This limits the window for stolen refresh tokens.

### 1.3 UI Shell Pattern

**Layout component** wraps all authenticated pages:
- Sidebar navigation (collapsible on mobile)
- Top header with user info + theme toggle
- Main content area
- Mobile: bottom navigation bar or hamburger menu

**Theme system:**
- Zustand store for theme state (`dark` | `light`), persisted to `localStorage`.
- CSS: Tailwind's `dark:` variant with `class` strategy (not `media`). The `<html>` element gets `class="dark"` toggled.
- shadcn/ui components natively support dark mode via CSS variables.

**Loading state pattern (UIUX-06):**
- Global loading spinner component.
- TanStack Query's `isLoading`/`isFetching` states drive UI loading indicators.
- Skeleton components for page-level loading.

### 1.4 Profile & Security Pattern

**Profile:**
- Level selection (`junior` | `senior`) during registration (PROF-01).
- Profile settings page to change level (PROF-02).
- Progress summary page with empty/zero state and placeholder message (PROF-03 — no real data yet in Phase 1).

**Security middleware stack** (applied in order on every request):
1. `helmet()` — security headers
2. `cors()` — cross-origin policy
3. `compression()` — gzip responses
4. `morgan()` — HTTP request logging
5. `express.json()` — parse JSON bodies
6. `cookieParser()` — parse cookies (for refresh token)
7. Rate limiters (per-route, applied at router level)
8. `authenticate` middleware (per-route, applied to protected routes)
9. `validate(schema)` middleware (per-route, validates request body/params/query with Zod)

---

## 2. Package Versions & Exact Dependencies

### 2.1 Client Dependencies (`client/package.json`)

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^19.0.0` | UI framework |
| `react-dom` | `^19.0.0` | React DOM renderer |
| `react-router-dom` | `^7.3.0` | Client-side routing |
| `zustand` | `^5.0.0` | Client UI state (theme, auth tokens) |
| `@tanstack/react-query` | `^5.67.0` | Server state management, caching |
| `zod` | `^3.24.0` | Schema validation (shared with server) |
| `react-hook-form` | `^7.54.0` | Form management |
| `@hookform/resolvers` | `^4.1.0` | Zod + React Hook Form bridge |
| `axios` | `^1.7.0` | HTTP client |
| `lucide-react` | `^0.475.0` | Icon library (used by shadcn/ui) |
| `clsx` | `^2.1.0` | Conditional class names |
| `tailwind-merge` | `^3.0.0` | Tailwind class conflict resolution |
| `sonner` | `^2.0.0` | Toast notifications |
| `class-variance-authority` | `^0.7.1` | Component variant management (shadcn/ui dependency) |

#### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.7.0` | Type checking |
| `vite` | `^6.2.0` | Build tool / dev server |
| `@vitejs/plugin-react` | `^4.3.0` | React support for Vite |
| `tailwindcss` | `^4.0.0` | Utility CSS framework |
| `@tailwindcss/vite` | `^4.0.0` | Tailwind Vite plugin |
| `@types/react` | `^19.0.0` | React type definitions |
| `@types/react-dom` | `^19.0.0` | React DOM type definitions |
| `eslint` | `^9.19.0` | Linting |
| `prettier` | `^3.4.0` | Code formatting |
| `eslint-config-prettier` | `^10.0.0` | ESLint + Prettier compatibility |

> **Note:** shadcn/ui is not an npm package. Components are copied into the codebase via `npx shadcn@latest add <component>`. The shadcn CLI will be used during setup.

### 2.2 Server Dependencies (`server/package.json`)

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | `^4.21.0` | HTTP server framework |
| `mongoose` | `^8.12.0` | MongoDB ODM |
| `jsonwebtoken` | `^9.0.0` | JWT creation and verification |
| `bcryptjs` | `^2.4.0` | Password hashing (pure JS, no native deps) |
| `cookie-parser` | `^1.4.0` | Parse cookies from request |
| `cors` | `^2.8.0` | CORS middleware |
| `helmet` | `^8.0.0` | Security HTTP headers |
| `morgan` | `^1.10.0` | HTTP request logging |
| `compression` | `^1.7.0` | Gzip response compression |
| `express-rate-limit` | `^7.5.0` | Rate limiting middleware |
| `zod` | `^3.24.0` | Request validation (shared schemas with client) |
| `dotenv` | `^16.4.0` | Environment variable loading |
| `winston` | `^3.17.0` | Structured logging |

#### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.7.0` | Type checking |
| `tsx` | `^4.19.0` | Run TypeScript directly (esbuild-based) |
| `nodemon` | `^3.1.0` | Auto-restart on file changes |
| `@types/express` | `latest` | Express type definitions |
| `@types/cors` | `latest` | CORS type definitions |
| `@types/morgan` | `latest` | Morgan type definitions |
| `@types/compression` | `latest` | Compression type definitions |
| `@types/cookie-parser` | `latest` | cookie-parser type definitions |
| `@types/jsonwebtoken` | `latest` | JWT type definitions |
| `@types/bcryptjs` | `latest` | bcryptjs type definitions |
| `eslint` | `^9.19.0` | Linting |
| `prettier` | `^3.4.0` | Code formatting |

### 2.3 Root Dependencies (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `concurrently` | `^9.1.0` | Run client + server dev simultaneously |

### 2.4 Packages NOT Needed in Phase 1

These are listed in STACK.md but belong to later phases:

- `openai`, `tiktoken` — Phase 2 (AI integration)
- `multer`, `pdf-parse` — Phase 2 (file upload)
- `recharts` — Phase 5 (analytics charts)
- `react-dropzone` — Phase 2 (file upload UI)
- `react-markdown` — Phase 6 (AI tutor)
- `date-fns` — Phase 5/6 (streak/analytics display)
- `supertest`, `vitest`, `@testing-library/react`, `msw` — can be added later; not blocking Phase 1 delivery

---

## 3. JWT + Refresh Token Implementation

### 3.1 Registration Flow

```
Client                              Server
  │                                    │
  │  POST /api/auth/register           │
  │  { email, password, name, level }  │
  │  ─────────────────────────────►    │
  │                                    │── Validate input (Zod schema)
  │                                    │── Check if email already exists
  │                                    │── Hash password: bcrypt.hash(password, 12)
  │                                    │── Create User document in MongoDB
  │                                    │── Generate access token (JWT, 15min)
  │                                    │── Generate refresh token (random bytes, 7d)
  │                                    │── Store hashed refresh token in User.refreshTokens[]
  │                                    │── Set refresh token as httpOnly cookie
  │  ◄─────────────────────────────    │
  │  200 { accessToken, user }         │
  │  Set-Cookie: refreshToken=...      │
  │                                    │
  │── Store accessToken in Zustand     │
  │── Redirect to Dashboard            │
```

### 3.2 Login Flow

```
Client                              Server
  │                                    │
  │  POST /api/auth/login              │
  │  { email, password }               │
  │  ─────────────────────────────►    │
  │                                    │── Validate input (Zod schema)
  │                                    │── Find user by email
  │                                    │── Compare: bcrypt.compare(password, user.passwordHash)
  │                                    │── If invalid: 401 { error: "Invalid email or password" }
  │                                    │── Generate access token (JWT, 15min)
  │                                    │── Generate refresh token (random bytes, 7d)
  │                                    │── Store hashed refresh token in User.refreshTokens[]
  │                                    │── Set refresh token as httpOnly cookie
  │  ◄─────────────────────────────    │
  │  200 { accessToken, user }         │
  │  Set-Cookie: refreshToken=...      │
```

### 3.3 Token Generation Details

**Access Token (JWT):**
```typescript
// Payload
{
  userId: string;    // User._id
  email: string;
  level: "junior" | "senior";
  iat: number;       // issued at (auto)
  exp: number;       // expires at (auto)
}

// Signing
jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })
```

**Refresh Token (Opaque):**
```typescript
import crypto from "crypto";

// Generate: 64 random bytes → hex string (128 chars)
const refreshToken = crypto.randomBytes(64).toString("hex");

// Store HASHED in database (never store raw)
const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

// Store in User document:
user.refreshTokens.push({
  token: hashedToken,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
});
```

### 3.4 Cookie Configuration

```typescript
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,       // Not accessible via JavaScript (XSS protection)
  secure: process.env.NODE_ENV === "production",  // HTTPS only in production
  sameSite: "strict",   // Prevent CSRF (strict for same-origin; use "lax" if frontend/backend on different subdomains)
  path: "/api/auth",    // Cookie only sent to auth endpoints (minimize exposure)
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
});
```

**Key decisions:**
- `sameSite: "strict"` — both client and server will be on the same origin in production (reverse proxy), or use "lax" if on different subdomains.
- `path: "/api/auth"` — restricts cookie transmission to auth endpoints only. The refresh token is only needed for `/api/auth/refresh` and `/api/auth/logout`.
- `secure: false` in development (localhost doesn't use HTTPS).

### 3.5 Refresh Token Rotation Flow

```
Client                              Server
  │                                    │
  │  POST /api/auth/refresh            │
  │  (cookie: refreshToken=abc123)     │
  │  ─────────────────────────────►    │
  │                                    │── Extract refreshToken from cookie
  │                                    │── Hash it: sha256(abc123)
  │                                    │── Find user with matching hash in refreshTokens[]
  │                                    │── If not found: 401 (token invalid or already used)
  │                                    │── If found but expired: remove it, 401
  │                                    │── REMOVE the used refresh token from array
  │                                    │── Generate NEW access token (JWT, 15min)
  │                                    │── Generate NEW refresh token (random bytes, 7d)
  │                                    │── Store NEW hashed refresh token in refreshTokens[]
  │                                    │── Set NEW refresh token as httpOnly cookie
  │  ◄─────────────────────────────    │
  │  200 { accessToken }               │
  │  Set-Cookie: refreshToken=new...   │
  │                                    │
  │── Store new accessToken in Zustand │
```

**Rotation security:** Each refresh token is single-use. If an attacker steals a refresh token and uses it, the legitimate user's next refresh will fail (their token was already consumed), alerting them to compromise. At that point, the legitimate user re-logs in, and the attacker's stolen token is already consumed.

**Token family invalidation (reuse detection):** If a refresh token that was already consumed is presented again, this indicates token theft. Response: delete ALL refresh tokens for that user, forcing re-authentication on all devices.

```typescript
// In refresh endpoint:
const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
const user = await User.findOne({ "refreshTokens.token": hashedToken });

if (!user) {
  // Token not found — could be reuse of a rotated token
  // Find user by checking if this token was recently rotated away
  // For simplicity in v1: just return 401
  return res.status(401).json({ error: "Invalid refresh token" });
}
```

### 3.6 Logout Flow

```
Client                              Server
  │                                    │
  │  POST /api/auth/logout             │
  │  Authorization: Bearer <access>    │
  │  (cookie: refreshToken=abc123)     │
  │  ─────────────────────────────►    │
  │                                    │── Extract refreshToken from cookie
  │                                    │── Hash it: sha256(abc123)
  │                                    │── Remove matching token from user.refreshTokens[]
  │                                    │── Clear the cookie
  │  ◄─────────────────────────────    │
  │  200 { message: "Logged out" }     │
  │  Set-Cookie: refreshToken=; Max-Age=0  │
  │                                    │
  │── Clear accessToken from Zustand   │
  │── Redirect to Login                │
```

### 3.7 Silent Refresh (Client-Side)

The client must silently refresh the access token:

1. **On app load:** Call `POST /api/auth/refresh`. If the cookie has a valid refresh token, the user gets a new access token without seeing a login page. If not, redirect to login.
2. **Before expiry:** Set a timer to refresh the access token ~1 minute before it expires (at the 14-minute mark for a 15-minute token). Parse `exp` from the JWT payload (decode without verification on client).
3. **On 401 response:** Axios interceptor catches 401 errors, attempts a refresh, and retries the original request. If refresh fails, redirect to login.

```typescript
// Axios response interceptor (simplified)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post("/api/auth/refresh");
        useAuthStore.getState().setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Mongoose Schema Design

### 4.1 User Model

```typescript
// server/src/models/User.ts

import mongoose, { Schema, Document } from "mongoose";

interface IRefreshToken {
  token: string;        // SHA-256 hash of the raw refresh token
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  level: "junior" | "senior";
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    level: {
      type: String,
      enum: ["junior", "senior"],
      required: true,
      default: "junior",
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
  },
  {
    timestamps: true,  // adds createdAt and updatedAt automatically
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });

// Limit stored refresh tokens per user (max 5 devices)
// Clean up expired tokens on each save
userSchema.pre("save", function (next) {
  const now = new Date();
  this.refreshTokens = this.refreshTokens
    .filter((rt) => rt.expiresAt > now)
    .slice(-5); // Keep only the 5 most recent
  next();
});

export const User = mongoose.model<IUser>("User", userSchema);
```

### 4.2 Index Definitions

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `users` | `{ email: 1 }` | Unique | Login lookup, duplicate check on registration |

**Phase 1 only needs the User collection.** Other collections (Materials, Questions, Attempts, WeakTopics) are created in later phases. The User schema is designed to be extended later (e.g., adding `dailyGoal`, `currentStreak`, `lastActiveDate` in Phase 6).

### 4.3 Fields Breakdown

| Field | Type | Required | Default | Constraint | Req |
|-------|------|----------|---------|------------|-----|
| `email` | String | Yes | — | unique, lowercase, trimmed | AUTH-01 |
| `passwordHash` | String | Yes | — | bcrypt hash (12 salt rounds) | AUTH-02 |
| `name` | String | Yes | — | trimmed, max 100 chars | AUTH-01 |
| `level` | String | Yes | `"junior"` | enum: `junior`, `senior` | PROF-01, PROF-02 |
| `refreshTokens` | Array | No | `[]` | Max 5 entries, auto-cleanup expired | AUTH-04 |
| `createdAt` | Date | Auto | now | Mongoose timestamps | — |
| `updatedAt` | Date | Auto | now | Mongoose timestamps | — |

---

## 5. Vite + React + shadcn/ui Setup

### 5.1 Step-by-Step Setup Sequence

**Step 1: Create Vite project**
```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
```

**Step 2: Install Tailwind CSS v4 (Vite plugin)**
```bash
npm install -D tailwindcss @tailwindcss/vite
```

Modify `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: Configure CSS entry point**

In `src/index.css`:
```css
@import "tailwindcss";
```

> **Tailwind v4 note:** Tailwind v4 uses CSS-native configuration via `@theme` directives instead of `tailwind.config.js`. The `@tailwindcss/vite` plugin handles content detection automatically. No `tailwind.config.js` file is needed.

**Step 4: Add path alias for shadcn/ui**

Update `tsconfig.json` (or `tsconfig.app.json` in Vite template):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Install path resolution for Vite:
```bash
npm install -D vite-tsconfig-paths
```

Update `vite.config.ts` to include `tsconfigPaths()` plugin:
```typescript
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  // ...
});
```

**Step 5: Initialize shadcn/ui**
```bash
npx shadcn@latest init
```

The CLI will ask configuration questions:
- Style: Default (or New York)
- Base color: Slate or Zinc (good for dark-first)
- CSS variables: Yes
- React Server Components: No (Vite SPA, not Next.js)
- Import alias for components: `@/components`
- Import alias for utils: `@/lib/utils`

This creates:
- `components.json` — shadcn configuration
- `src/lib/utils.ts` — `cn()` utility function (clsx + tailwind-merge)
- CSS variables for theme colors in `src/index.css`

**Step 6: Add shadcn/ui components needed for Phase 1**
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add select
npx shadcn@latest add form
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add toast       # or use sonner
npx shadcn@latest add sonner      # preferred toast library
npx shadcn@latest add sheet       # mobile sidebar
npx shadcn@latest add navigation-menu
```

**Step 7: Install remaining client dependencies**
```bash
npm install react-router-dom zustand @tanstack/react-query zod react-hook-form @hookform/resolvers axios lucide-react clsx tailwind-merge sonner class-variance-authority
```

**Step 8: Configure dark theme as default**

In `src/index.css` (after shadcn init modifies it), ensure CSS variables define both light and dark themes. The `dark` class on `<html>` activates dark mode.

In `src/main.tsx` or app initialization:
```typescript
// Apply dark class by default (read from localStorage or default to dark)
const theme = localStorage.getItem("theme") || "dark";
document.documentElement.classList.toggle("dark", theme === "dark");
```

### 5.2 shadcn/ui + Tailwind v4 Compatibility Note

shadcn/ui has been updated to support Tailwind v4. The `npx shadcn@latest init` command detects Tailwind v4 and generates compatible CSS. Key differences from Tailwind v3:
- No `tailwind.config.js` — configuration is in CSS via `@theme` blocks
- Color variables use OKLCH format by default
- `darkMode: "class"` is the default behavior (no config needed)

---

## 6. Express Middleware Stack

### 6.1 Middleware Order (in `server/src/app.ts`)

```typescript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { globalLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

const app = express();

// 1. Security headers (FIRST — sets CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// 2. CORS (before any route handling)
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,             // Required for cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 3. Compression (compress all responses)
app.use(compression());

// 4. Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 5. Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// 6. Cookie parsing (for refresh token)
app.use(cookieParser());

// 7. Global rate limiter (applies to all routes)
app.use(globalLimiter);

// 8. Routes (auth routes have their own stricter rate limiter)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 9. 404 handler
app.use(notFoundHandler);

// 10. Global error handler (LAST — catches all thrown/next(err) errors)
app.use(errorHandler);
```

### 6.2 Middleware Configuration Details

**helmet (security headers):**
```typescript
// Default helmet() is sufficient for Phase 1.
// It sets: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, X-XSS-Protection, etc.
app.use(helmet());
```

**cors:**
```typescript
// Development: allow Vite dev server
// Production: allow deployed frontend URL
const corsOptions: cors.CorsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // CRITICAL: required for httpOnly cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

> **Dev vs Prod CORS:**
> - Development: `origin: "http://localhost:5173"` (Vite dev server)
> - Production: `origin: "https://studyai.example.com"` (deployed frontend)
> - With Vite's proxy, during development the client and API are on the same origin (localhost:5173), so CORS is technically not needed. But configure it anyway to match production behavior.

**compression:**
```typescript
// Default compression() compresses all responses > 1KB with gzip.
// No custom config needed for Phase 1.
app.use(compression());
```

**morgan (logging):**
```typescript
// "dev" format: colored concise output for development
// "combined" format: Apache-style logs for production (suitable for log analysis)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
```

**express.json:**
```typescript
// Limit body size to 1MB (prevents abuse, sufficient for JSON API requests)
app.use(express.json({ limit: "1mb" }));
```

**cookie-parser:**
```typescript
// No secret needed — we don't use signed cookies.
// Refresh token integrity is verified via database lookup, not cookie signature.
app.use(cookieParser());
```

### 6.3 Auth Middleware

```typescript
// server/src/middleware/authenticate.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userLevel?: string;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Access token required" },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      userId: string;
      email: string;
      level: string;
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userLevel = decoded.level;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Access token invalid or expired" },
    });
  }
}
```

### 6.4 Validation Middleware

```typescript
// server/src/middleware/validate.ts

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: err.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}
```

### 6.5 Error Handler

```typescript
// server/src/middleware/error-handler.ts

import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unexpected errors
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
```

---

## 7. Security Considerations

### 7.1 Rate Limiting Configuration

```typescript
// server/src/middleware/rate-limit.ts

import rateLimit from "express-rate-limit";

// Global rate limiter (all routes)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per 15 min per IP
  standardHeaders: true,       // Return rate limit info in headers (RateLimit-*)
  legacyHeaders: false,        // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Too many requests, try again later" },
  },
});

// Strict rate limiter for auth endpoints (SECR-05)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 10,                     // 10 attempts per 15 min per IP
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT",
      message: "Too many login attempts, please try again in 15 minutes",
    },
  },
});

// Rate limiter for AI endpoints (SECR-06 — placeholder for Phase 2+)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1-hour window
  max: 30,                     // 30 AI calls per hour per IP
  message: {
    success: false,
    error: { code: "AI_RATE_LIMIT", message: "AI request limit exceeded, try again later" },
  },
});
```

**Usage in routes:**
```typescript
import { authLimiter } from "../middleware/rate-limit";

const router = express.Router();
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);  // No auth limiter on refresh (it's automatic)
router.post("/logout", authenticate, logout);
```

### 7.2 CORS Settings

| Environment | `origin` | `credentials` | Notes |
|------------|----------|---------------|-------|
| Development | `"http://localhost:5173"` | `true` | Vite dev server |
| Production | `process.env.CLIENT_URL` (e.g., `"https://studyai.vercel.app"`) | `true` | Deployed frontend |

**Critical:** `credentials: true` is required for the browser to send/receive httpOnly cookies cross-origin. Without it, the refresh token cookie will never be sent.

### 7.3 Helmet Defaults

Helmet v8 sets these headers by default (all appropriate for Phase 1):
- `Content-Security-Policy` — restricts resource loading sources
- `Cross-Origin-Opener-Policy` — prevents cross-origin window access
- `Cross-Origin-Resource-Policy` — restricts resource loading
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-XSS-Protection: 0` — legacy header (modern browsers use CSP instead)
- `Strict-Transport-Security` — enforces HTTPS

No custom helmet configuration needed for Phase 1. Default `helmet()` is sufficient.

### 7.4 Input Validation with Zod

**Shared validation schemas:**

```typescript
// Defined in both client and server (or shared package)

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  level: z.enum(["junior", "senior"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  level: z.enum(["junior", "senior"]).optional(),
});
```

### 7.5 SECR-03 (File Upload Limits) — Phase 1 Stub

SECR-03 requires file upload to be limited by type and size. While actual file upload is Phase 2, the middleware pattern should be established in Phase 1:

```typescript
// server/src/middleware/upload.ts (stub for Phase 1, implemented in Phase 2)
// Multer config: accept only PDF and text, max 10MB
// This file is created as a placeholder with the correct configuration
// but not wired into any routes until Phase 2.
```

### 7.6 SECR-04 (OpenAI Key Server-Side Only)

- OpenAI API key lives ONLY in `server/.env` as `OPENAI_API_KEY`.
- No `VITE_OPENAI_*` variables exist in `client/.env`.
- Verification: run `npm run build` in client, then search the output bundle for any OpenAI-related strings.
- The `.env.example` files document which variables belong where.

---

## 8. File Structure

### 8.1 Complete Phase 1 File Tree

```
study-app/
├── .planning/                          # (existing) planning docs
├── .env.example                        # Root env template (documents both client + server vars)
├── .gitignore                          # Ignore node_modules, .env, dist
├── package.json                        # Root: concurrently scripts only
│
├── client/
│   ├── .env                            # VITE_API_URL=http://localhost:3000 (dev only)
│   ├── .env.example                    # Template for client env vars
│   ├── index.html                      # Vite entry HTML
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json               # App-specific TS config
│   ├── tsconfig.node.json              # Node/Vite TS config
│   ├── vite.config.ts
│   ├── components.json                 # shadcn/ui configuration
│   ├── eslint.config.js                # ESLint v9 flat config
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx                    # App entry point (React 19 createRoot)
│       ├── App.tsx                     # Root component: Router + Providers
│       ├── index.css                   # Tailwind imports + shadcn CSS variables
│       ├── vite-env.d.ts               # Vite type declarations
│       │
│       ├── api/
│       │   ├── client.ts               # Axios instance with interceptors
│       │   └── auth.ts                 # Auth API functions: login, register, refresh, logout
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx        # Authenticated layout shell
│       │   │   ├── Sidebar.tsx          # Navigation sidebar
│       │   │   ├── Header.tsx           # Top bar with user menu + theme toggle
│       │   │   └── MobileNav.tsx        # Mobile bottom/hamburger nav
│       │   ├── auth/
│       │   │   ├── LoginForm.tsx        # Login form component
│       │   │   ├── RegisterForm.tsx     # Registration form component
│       │   │   └── ProtectedRoute.tsx   # Route guard (redirect if not authenticated)
│       │   ├── profile/
│       │   │   └── LevelSelect.tsx      # Junior/Senior level selector
│       │   ├── common/
│       │   │   ├── ThemeToggle.tsx       # Dark/light mode toggle button
│       │   │   ├── LoadingSpinner.tsx    # Loading indicator
│       │   │   └── PageSkeleton.tsx      # Skeleton loading state
│       │   └── ui/                      # shadcn/ui generated components
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── card.tsx
│       │       ├── select.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── avatar.tsx
│       │       ├── form.tsx
│       │       ├── separator.tsx
│       │       ├── skeleton.tsx
│       │       ├── sheet.tsx
│       │       ├── navigation-menu.tsx
│       │       └── sonner.tsx
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx            # /login route
│       │   ├── RegisterPage.tsx         # /register route
│       │   ├── DashboardPage.tsx        # / (home) — authenticated
│       │   ├── ProfilePage.tsx          # /profile — settings + level change
│       │   └── ProgressPage.tsx         # /progress — empty/zero state with placeholder
│       │
│       ├── stores/
│       │   ├── auth-store.ts            # Zustand: accessToken, user object, login/logout
│       │   └── theme-store.ts           # Zustand: theme preference, persisted to localStorage
│       │
│       ├── schemas/
│       │   └── auth.schemas.ts          # Zod schemas for auth forms (shared with server)
│       │
│       ├── hooks/
│       │   ├── use-auth.ts              # Custom hook: wraps auth store + TanStack Query
│       │   └── use-theme.ts             # Custom hook: wraps theme store
│       │
│       ├── lib/
│       │   └── utils.ts                 # cn() utility (generated by shadcn)
│       │
│       └── types/
│           └── index.ts                 # Shared TypeScript types (User, ApiResponse, etc.)
│
└── server/
    ├── .env                             # JWT secrets, MongoDB URI, port, client URL
    ├── .env.example                     # Template for server env vars
    ├── package.json
    ├── tsconfig.json
    ├── nodemon.json                     # nodemon config for tsx
    ├── eslint.config.js                 # ESLint v9 flat config
    └── src/
        ├── server.ts                    # Entry point: connect DB, start listening
        ├── app.ts                       # Express app setup: middleware + routes
        │
        ├── config/
        │   ├── env.ts                   # Validate & export env vars (Zod-validated)
        │   ├── db.ts                    # MongoDB/Mongoose connection
        │   └── logger.ts               # Winston logger setup
        │
        ├── models/
        │   └── User.ts                  # User Mongoose schema & model
        │
        ├── routes/
        │   ├── auth.routes.ts           # POST /register, /login, /refresh, /logout
        │   └── user.routes.ts           # GET /me, PATCH /me (profile updates)
        │
        ├── services/
        │   └── auth.service.ts          # Business logic: register, login, refresh, logout
        │
        ├── middleware/
        │   ├── authenticate.ts          # JWT verification middleware
        │   ├── validate.ts              # Zod request validation middleware
        │   ├── rate-limit.ts            # Rate limiter configurations
        │   ├── error-handler.ts         # Centralized error handler + AppError class
        │   └── not-found.ts             # 404 handler
        │
        ├── schemas/
        │   └── auth.schemas.ts          # Zod schemas (register, login, update profile)
        │
        └── types/
            └── index.ts                 # Server-side TypeScript types (AuthRequest, etc.)
```

### 8.2 Files NOT Created in Phase 1

These belong to later phases:
- `server/src/models/Material.ts` — Phase 2
- `server/src/models/Question.ts` — Phase 3
- `server/src/models/Attempt.ts` — Phase 4
- `server/src/models/WeakTopic.ts` — Phase 5
- `server/src/services/ai/` — Phase 2
- `server/src/middleware/upload.ts` — Phase 2 (multer)
- `client/src/pages/PracticePage.tsx` — Phase 4
- `client/src/pages/UploadPage.tsx` — Phase 2
- `client/src/pages/AnalyticsPage.tsx` — Phase 5

---

## 9. API Route Specification

### 9.1 Auth Routes (`/api/auth`)

#### POST `/api/auth/register` — Create account (AUTH-01, AUTH-02, PROF-01)

| Property | Value |
|----------|-------|
| **Auth** | No |
| **Rate Limit** | `authLimiter` (10 per 15min) |
| **Request Body** | `{ email: string, password: string, name: string, level: "junior" \| "senior" }` |
| **Validation** | `registerSchema` (Zod) |
| **Success Response (201)** | `{ success: true, data: { accessToken: string, user: { id, email, name, level } } }` |
| **Cookie Set** | `refreshToken` (httpOnly, secure, sameSite=strict, path=/api/auth, maxAge=7d) |
| **Error 409** | `{ success: false, error: { code: "EMAIL_EXISTS", message: "An account with this email already exists" } }` |
| **Error 400** | `{ success: false, error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }` |

#### POST `/api/auth/login` — Authenticate (AUTH-03, AUTH-06)

| Property | Value |
|----------|-------|
| **Auth** | No |
| **Rate Limit** | `authLimiter` (10 per 15min, skip successful) |
| **Request Body** | `{ email: string, password: string }` |
| **Validation** | `loginSchema` (Zod) |
| **Success Response (200)** | `{ success: true, data: { accessToken: string, user: { id, email, name, level } } }` |
| **Cookie Set** | `refreshToken` (same config as register) |
| **Error 401** | `{ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } }` |

> **AUTH-06:** Error messages must NOT reveal whether the email exists. Always return "Invalid email or password" for both wrong email and wrong password.

#### POST `/api/auth/refresh` — Rotate refresh token (AUTH-04)

| Property | Value |
|----------|-------|
| **Auth** | No (uses cookie) |
| **Rate Limit** | Global limiter only |
| **Request Body** | None |
| **Cookie Read** | `refreshToken` from httpOnly cookie |
| **Success Response (200)** | `{ success: true, data: { accessToken: string } }` |
| **Cookie Set** | New `refreshToken` (rotation) |
| **Error 401** | `{ success: false, error: { code: "INVALID_REFRESH_TOKEN", message: "Session expired, please log in again" } }` |

#### POST `/api/auth/logout` — Invalidate session (AUTH-05)

| Property | Value |
|----------|-------|
| **Auth** | Yes (access token in header) |
| **Rate Limit** | Global limiter only |
| **Request Body** | None |
| **Cookie Read** | `refreshToken` from httpOnly cookie |
| **Success Response (200)** | `{ success: true, data: { message: "Logged out successfully" } }` |
| **Cookie Clear** | `refreshToken` cleared (maxAge=0) |

### 9.2 User Routes (`/api/users`)

#### GET `/api/users/me` — Get current user profile (PROF-02, PROF-03)

| Property | Value |
|----------|-------|
| **Auth** | Yes |
| **Success Response (200)** | `{ success: true, data: { id, email, name, level, createdAt } }` |

#### PATCH `/api/users/me` — Update profile (PROF-02)

| Property | Value |
|----------|-------|
| **Auth** | Yes |
| **Request Body** | `{ name?: string, level?: "junior" \| "senior" }` |
| **Validation** | `updateProfileSchema` (Zod) |
| **Success Response (200)** | `{ success: true, data: { id, email, name, level, createdAt } }` |
| **Error 400** | Validation errors |

### 9.3 Health Check

#### GET `/api/health` — Server health check

| Property | Value |
|----------|-------|
| **Auth** | No |
| **Success Response (200)** | `{ success: true, data: { status: "ok", timestamp: string } }` |

### 9.4 Response Envelope

All API responses follow a consistent envelope:

```typescript
// Success
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Error
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## 10. Validation Architecture — Requirement Verification

### 10.1 Requirement-to-Verification Mapping

| Req ID | Requirement | Verification Method |
|--------|------------|---------------------|
| **AUTH-01** | User can create account with email and password | POST `/api/auth/register` returns 201 with `accessToken` and `user` object. User document exists in MongoDB with email, name, level, passwordHash. |
| **AUTH-02** | User password is hashed before storage (bcrypt) | Query User document directly in MongoDB — `passwordHash` field starts with `$2a$` or `$2b$` (bcrypt prefix). Raw password does NOT appear anywhere in the database. |
| **AUTH-03** | User can log in and receive JWT access token | POST `/api/auth/login` with valid credentials returns 200 with `accessToken`. Token is a valid JWT that decodes with correct `userId`, `email`, and `exp` fields. |
| **AUTH-04** | User session persists via refresh token rotation | 1. Login → receive refresh token cookie. 2. Wait or close browser. 3. POST `/api/auth/refresh` → receive new access token and new refresh token cookie. 4. Old refresh token is invalidated (using it again returns 401). 5. Page refresh with valid refresh cookie auto-restores session. |
| **AUTH-05** | User can log out from any page | POST `/api/auth/logout` → refresh token removed from database, cookie cleared. Subsequent refresh attempts fail with 401. Access token in memory is cleared. UI redirects to login. |
| **AUTH-06** | User receives clear error messages for invalid credentials | 1. Login with wrong password → 401 "Invalid email or password". 2. Login with non-existent email → same 401 "Invalid email or password" (no email enumeration). 3. Registration with existing email → 409 "An account with this email already exists". 4. Invalid form data → 400 with specific field-level error messages. |
| **PROF-01** | User can set level during signup (junior/senior) | Registration form includes level selector. POST `/api/auth/register` body includes `level` field. User document in MongoDB has correct `level` value. |
| **PROF-02** | User can change level from profile settings | Profile page shows current level and allows change. PATCH `/api/users/me` with `{ level: "senior" }` updates successfully. GET `/api/users/me` reflects the new level. |
| **PROF-03** | User can view their progress summary | Progress page exists and renders. For Phase 1: shows empty/zero state with placeholder message ("Start practicing to see your progress here!"). No data dependencies. |
| **UIUX-01** | Dark theme is the default appearance | On first visit (no `localStorage`), app renders with dark theme. `<html>` has `class="dark"`. Background is dark, text is light. |
| **UIUX-02** | User can toggle between dark and light themes | ThemeToggle button visible. Clicking toggles between dark and light. Preference persists in `localStorage`. Page refresh preserves theme choice. |
| **UIUX-03** | All pages are mobile responsive | Test every Phase 1 page at 375px width (iPhone SE). No horizontal overflow. Navigation is usable. Forms are full-width. Touch targets ≥44px. |
| **UIUX-04** | UI is clean, minimal, and distraction-free | Visual review: no clutter, consistent spacing, clear hierarchy. shadcn/ui components provide consistent styling. No unnecessary decorative elements. |
| **UIUX-06** | Loading states shown during AI operations | For Phase 1: loading spinner shown during auth operations (login, register, token refresh). Skeleton states for profile loading. Pattern established for future AI loading states. |
| **SECR-01** | All API endpoints validate input | Send malformed JSON, missing fields, wrong types to every endpoint. All return 400 with specific validation errors. No endpoint processes unvalidated input. |
| **SECR-02** | API calls require valid JWT (except auth routes) | GET `/api/users/me` without Authorization header → 401. With expired token → 401. With valid token → 200. Auth routes (`/api/auth/*`) work without token. |
| **SECR-03** | File upload limited by type and size | Phase 1: multer middleware configured with file type (PDF, text) and size (10MB) limits. Not wired to routes yet (Phase 2). Configuration file exists and is tested. |
| **SECR-04** | OpenAI API key is server-side only | 1. Build client: `npm run build` in `client/`. 2. Search all files in `client/dist/` for "sk-" or "openai" — zero matches. 3. No `VITE_OPENAI_*` variables in client `.env`. 4. `server/.env` contains `OPENAI_API_KEY` (placeholder for Phase 2). |
| **SECR-05** | Rate limiting on auth endpoints | 1. Send 11 POST requests to `/api/auth/login` within 15 minutes from same IP. 2. Request 11 returns 429 "Too many login attempts". 3. After window expires, requests succeed again. |
| **SECR-06** | Rate limiting on AI endpoints | Phase 1: `aiLimiter` middleware created and exported. Not applied to any routes yet (no AI routes in Phase 1). Rate limiter config: 30 requests/hour per IP. Ready to apply in Phase 2. |

### 10.2 Quick Smoke Test Sequence

After Phase 1 is complete, run this sequence to verify all requirements:

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

## Appendix A: Environment Variables

### `server/.env`

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/studyai

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-change-in-production

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# OpenAI (Phase 2 — placeholder)
OPENAI_API_KEY=sk-placeholder-add-in-phase-2
```

### `client/.env`

```bash
# API URL (only used if NOT using Vite proxy)
VITE_API_URL=http://localhost:3000
```

### `server/src/config/env.ts`

```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
```

---

## Appendix B: Root Package Scripts

```json
{
  "name": "studyai",
  "private": true,
  "scripts": {
    "dev": "concurrently -n client,server -c cyan,green \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "npm run dev --prefix client",
    "dev:server": "npm run dev --prefix server",
    "build:client": "npm run build --prefix client",
    "install:all": "npm install && npm install --prefix client && npm install --prefix server"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

### Server `package.json` Scripts

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Server `nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "tsx src/server.ts"
}
```

### Client `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

---

## Appendix C: Concerns & Open Questions

### Resolved Decisions (Locked)

1. **Refresh token storage:** httpOnly cookie with rotation — confirmed.
2. **State management:** Zustand for UI state (theme, auth), TanStack Query for server state — confirmed.
3. **PROF-03 in Phase 1:** Build the UI page with empty/zero state + placeholder message. No real data yet — confirmed.
4. **Monorepo structure:** `client/` + `server/` directories with root `concurrently` — confirmed.
5. **SECR-03 and SECR-06 in Phase 1:** Create the middleware configurations but don't wire them to routes until their respective phases (Phase 2 for upload, Phase 2+ for AI endpoints) — confirmed.

### Concerns to Track

1. **Tailwind v4 + shadcn/ui compatibility:** shadcn/ui has announced Tailwind v4 support, but it's relatively new. The `npx shadcn@latest init` command should detect Tailwind v4 and configure accordingly. If issues arise, the fallback is Tailwind v3 with `tailwind.config.js`. Monitor during setup.

2. **Vite proxy vs CORS in development:** Using Vite's proxy (`/api → localhost:3000`) means the client and server appear to be on the same origin in dev, so cookies work without `sameSite` issues. In production, the frontend and backend will be on different origins (Vercel + Render), requiring proper CORS + `sameSite=lax` (not `strict`) for cookies to work. **Decision: use `sameSite: "lax"` for production compatibility**, and `"strict"` only if same-origin deployment is confirmed.

3. **Refresh token cookie `path` restriction:** Setting `path: "/api/auth"` means the cookie is only sent to auth endpoints, which is more secure. However, this requires the refresh endpoint to be under `/api/auth/refresh` specifically. Any deviation breaks the flow. This is fine as long as the route structure is respected.

4. **bcrypt salt rounds:** Using 12 rounds. This takes ~250ms per hash on modern hardware. Acceptable for auth endpoints (login/register are infrequent). If it causes noticeable latency in development, 10 rounds is also acceptable.

5. **`sameSite` cookie behavior across different browsers:** `sameSite: "strict"` prevents the cookie from being sent on any cross-site navigation (even clicking a link from email to the app). For development behind Vite proxy this doesn't matter, but for production with separate domains, `"lax"` is safer. **The planner should use `"lax"` to be safe.**

---

*Research completed: 2026-03-17*
*Phase: 1 — Foundation & Auth*
*Ready for planning.*
