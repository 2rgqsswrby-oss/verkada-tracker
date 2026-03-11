# CLAUDE.md — Verkada Tracker

This file provides context for AI assistants working in this repository.

## Project Overview

Verkada Tracker is a Next.js full-stack web application for managing Verkada camera deployment projects. It has two roles:

- **Installer (Tracker)**: Full CRUD access to camera records, photo uploads, and status tracking.
- **Customer (Dashboard)**: Read-only progress view with real-time stats and PDF export.

**Stack**: Next.js 14, React 18, Supabase (PostgreSQL + Storage), Vercel (hosting).

---

## Repository Structure

```
verkada-tracker/
├── pages/
│   ├── index.js          # Installer tracker dashboard (main CRUD UI)
│   ├── login.js          # Shared login page (role-aware styling)
│   ├── dashboard.js      # Customer read-only progress dashboard
│   └── api/
│       ├── auth.js       # POST /api/auth — password login, sets cookies
│       ├── cameras/
│       │   ├── index.js  # GET /api/cameras, POST /api/cameras
│       │   ├── [id].js   # PUT/DELETE /api/cameras/[id]
│       │   ├── upload.js # POST /api/cameras/upload — photo uploads
│       │   └── pdf.js    # GET /api/pdf — generate PDF report
├── middleware.js          # Cookie auth guard for / and /dashboard
├── next.config.js         # Cache-control headers (no-store on all routes)
├── package.json
└── README.md              # Setup and deployment guide
```

---

## Database Schema (Supabase)

Table: `cameras`

| Column              | Type        | Notes                        |
|---------------------|-------------|------------------------------|
| id                  | uuid (PK)   | auto-generated               |
| name                | text        | Camera label/identifier      |
| floor               | text        | Building floor               |
| model               | text        | Verkada camera model         |
| ip                  | text        | IP address                   |
| switch_name         | text        |                              |
| switch_port         | text        |                              |
| photo_install_url   | text        | URL from Supabase Storage    |
| screenshot_view_url | text        | URL from Supabase Storage    |
| notes               | text        |                              |
| serial_number       | text        | Added via migration (Step 1b)|
| created_at          | timestamptz | auto-set                     |

Storage bucket: `camera-photos` (public)
Photo path pattern: `{cameraId}/{photoType}-{timestamp}.{ext}`
Photo types: `install`, `view`

---

## Environment Variables

Required in `.env.local` (dev) or Vercel environment settings (prod):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TRACKER_PASSWORD=your-installer-password
DASHBOARD_PASSWORD=your-customer-password
```

Never commit these values. The service key has admin DB access.

---

## API Reference

### Authentication
```
POST /api/auth
Body: { password: string, role: "tracker" | "dashboard" }
Sets: HttpOnly, SameSite=Strict cookie (8-hour TTL)
```

### Cameras
```
GET    /api/cameras          → Camera[]
POST   /api/cameras          → Camera (created)
PUT    /api/cameras/[id]     → Camera (updated)
DELETE /api/cameras/[id]     → { ok: true }
```

### Photo Upload
```
POST /api/cameras/upload
Body: { id: uuid, photoData: base64string, mimeType: string, photoType: "install"|"view" }
Response: { url: string }
Body limit: 6MB (client compresses images to <500KB before sending)
```

### PDF Export
```
GET /api/pdf → application/pdf
Filename: verkada-deployment-YYYY-MM-DD.pdf
```

---

## Key Conventions

### Naming
- **Database columns**: `snake_case` (e.g., `photo_install_url`, `switch_name`)
- **JavaScript objects**: `camelCase` (e.g., `photoInstallUrl`, `switchName`)
- Transformation helpers in `pages/api/cameras/index.js` and `[id].js`:
  - `toJS(row)` — converts DB row to JS object
  - `toDB(camera)` — converts JS object to DB columns

### Styling
- All CSS is **inline style objects** — no external stylesheets, no CSS modules, no Tailwind.
- Dark theme UI with color variables defined at the top of each page component.

### State Management
- **React local state only** (`useState`, `useEffect`, `useMemo`).
- No Redux, Context API, or external state libraries.

### Image Handling
- Client-side compression using Canvas API before upload.
- Target: reduce 8–15MB photos to under 500KB JPEG.
- Server receives base64, converts to Buffer, uploads to Supabase Storage.

### Authentication Flow
- Password-only (no usernames). Separate passwords for each role.
- Middleware (`middleware.js`) checks cookies on every request to `/` and `/dashboard`.
- Unauthenticated requests redirect to `/login?role=tracker` or `/login?role=dashboard`.

### Camera Completion Logic
A camera is considered "DONE" when all of these fields are non-empty:
`name`, `floor`, `model`, `ip`, `switchName`, `switchPort`, `photoInstallUrl`, `screenshotViewUrl`, `serialNumber`

### Valid Values
- **Models**: CM42, CF83-E, CD63, CD63-E, CD43-E, CB52-E, CP52-E, CY53-E
- **Floors**: Exterior, 1–12, 14–19, Roof (19 total floor options + Exterior)
- **Total cameras expected**: 211

---

## Development Workflow

### Local Setup
```bash
npm install
# Create .env.local with the required env vars above
npm run dev        # Starts at http://localhost:3000
```

### Build & Deploy
```bash
npm run build      # Production build
npm run start      # Serve production build locally
```

Deployment is via **Vercel** connected to the GitHub repo. Pushing to `master` triggers an automatic deploy.

### No Test Suite
There are no automated tests in this project. Validate changes manually:
1. Test login with both tracker and dashboard passwords.
2. Verify CRUD operations on cameras.
3. Test photo upload (check Supabase Storage bucket).
4. Verify PDF generation.
5. Check that unauthenticated requests redirect to login.

---

## Architecture Notes

- **Pages Router** (not App Router) — all routes are under `pages/`.
- **No shared components directory** — UI components are defined inline within their page files.
- **`PhotoUpload`** is the only extracted sub-component, defined at the bottom of `pages/index.js`.
- **Cache prevention** is critical — all routes set `no-store` headers to prevent Vercel's CDN from caching authenticated responses.
- **Supabase client** is instantiated per-request in API routes using the service role key (server-side only — never expose to the client).
- **PDF generation** uses `pdfkit` with `blob-stream`, streamed directly to the HTTP response.
