# Phase 7 Research: Polish & Deploy

## Overview

Phase 7 is the final polish phase covering UI/UX refinement, mobile responsiveness audit, and production deployment. This phase transforms the working application into a production-ready deployment.

## Requirements Analysis

### UI/UX Polish (UIUX-05)
- **UIUX-05**: Answer feedback is visually clear (green/red, explanation visible)

Current state in `FeedbackDisplay.tsx`:
- Basic green/red backgrounds and border colors exist
- Uses unicode checkmarks instead of icons
- Light theme hard-coded colors (`bg-green-50`, `bg-red-50`) don't work well in dark mode
- Explanation visible but not prominently styled
- Button uses hard-coded blue instead of theme-aware colors

### Mobile Responsiveness (UIUX-03 implicit)
Current state audit needed for:
- Sidebar navigation (collapse behavior on mobile)
- Practice page question cards (text sizing, button sizing)
- Analytics charts (responsive sizing)
- Forms and inputs (touch target sizes)
- Modals/dialogs (mobile viewport handling)

### Deployment
- Frontend: Vercel (static hosting for Vite build)
- Backend: Render or Railway (Node.js hosting)
- Database: MongoDB Atlas (cloud MongoDB)

## Current Codebase Patterns

### UI Component Patterns

**Color System (Dark Mode Aware):**
- Uses oklch tokens via Tailwind v4
- Theme variables in CSS: `--background`, `--foreground`, `--primary`, etc.
- Components use semantic colors: `bg-background`, `text-foreground`, `bg-muted`, `border-border`

**Icon Library:**
- Lucide React for all icons
- Pattern: `<Check className="h-4 w-4" />`, `<X className="h-4 w-4" />`

**Feedback Color Guidelines (Dark Mode Compatible):**
- Success: `text-green-500`, `bg-green-500/10`, `border-green-500/50`
- Error: `text-red-500`, `bg-red-500/10`, `border-red-500/50`
- Neutral: `text-muted-foreground`, `bg-muted`

**Card Component Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Button Patterns:**
- Primary: `<Button>Action</Button>`
- Secondary: `<Button variant="outline">Action</Button>`
- Destructive: `<Button variant="destructive">Delete</Button>`
- Ghost: `<Button variant="ghost">Link</Button>`

### Responsive Patterns

**Container:**
```tsx
<div className="container mx-auto px-4">
```

**Grid Breakpoints:**
- Mobile-first: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Sidebar hide: `hidden md:block` / `md:hidden`

**Typography Scaling:**
- Headings: `text-2xl md:text-3xl`
- Body: `text-sm md:text-base`

### Current Mobile Issues (Identified)

1. **FeedbackDisplay.tsx**: Hard-coded light theme colors don't adapt to dark mode
2. **PracticePage.tsx**: Uses `bg-gray-50` background (light-only)
3. **Sidebar**: May not collapse properly on mobile
4. **Analytics charts**: Need `ResponsiveContainer` wrapper validation

## Deployment Requirements

### Frontend (Vercel)

**Required:**
- `vercel.json` configuration for SPA routing
- Environment variable: `VITE_API_URL` pointing to backend

**Configuration:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Backend (Render)

**Required:**
- `render.yaml` or manual configuration
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables:
  - `MONGODB_URI` (Atlas connection string)
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `OPENAI_API_KEY`
  - `CLIENT_URL` (Vercel frontend URL)
  - `NODE_ENV=production`

**Health Check:**
- Route: `/api/health` (needs to be created)

### MongoDB Atlas

**Required:**
- Cluster creation
- Database user credentials
- IP whitelist (0.0.0.0/0 for dynamic Render IPs)
- Connection string with credentials

### CORS Configuration

Production CORS update in `server/src/app.ts`:
```typescript
cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})
```

### Cookie Configuration

Production cookie settings in auth routes:
```typescript
res.cookie("refreshToken", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

## Plan Structure

### Plan 07-01: UI Polish & Answer Feedback (Wave 1)
- Fix FeedbackDisplay dark mode compatibility
- Update PracticePage background colors
- Add prominent explanation styling
- Use Lucide icons instead of unicode
- Test visual feedback clarity

### Plan 07-02: Mobile Responsiveness Audit (Wave 1)
- Audit all pages on mobile viewport
- Fix sidebar mobile behavior
- Ensure touch targets are 44px+
- Verify charts are responsive
- Test forms on mobile

### Plan 07-03: Production Deployment (Wave 2)
- Create deployment configuration files
- Add health check endpoint
- Update CORS and cookie settings for production
- Create production environment variable templates
- Deploy and verify end-to-end flow

## Files to Modify

### Plan 07-01 (UI Polish)
- `client/src/components/practice/FeedbackDisplay.tsx` - Dark mode, icons, prominence
- `client/src/pages/PracticePage.tsx` - Background color fix

### Plan 07-02 (Mobile)
- `client/src/components/layout/Sidebar.tsx` - Mobile collapse
- `client/src/pages/AnalyticsPage.tsx` - Chart responsiveness
- Various pages - Touch target sizes

### Plan 07-03 (Deployment)
- `client/vercel.json` - CREATE
- `server/render.yaml` - CREATE (optional, can use dashboard)
- `server/src/routes/health.routes.ts` - CREATE
- `server/src/app.ts` - Add health route
- `.env.production.example` files - CREATE

## Dependencies

No new npm dependencies required. All deployment platforms support existing stack.

---
*Research completed: 2026-03-18*
