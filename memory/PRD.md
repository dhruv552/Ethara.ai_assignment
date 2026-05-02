# Team Task Manager — PRD

## Original Problem Statement
Build a full-stack Team Task Manager (originally MERN) for managing projects, assigning tasks, and tracking team progress. Features role-based access control (Admin / Member), JWT auth, and a live dashboard. Implemented as **FastAPI + React + MongoDB** at user's request (functionally identical APIs).

## Architecture
- **Backend**: FastAPI single-file (`/app/backend/server.py`) with JWT auth (PyJWT + bcrypt), Motor (async MongoDB), UUID-based document IDs, ISO datetime strings.
- **Frontend**: React 19 + Tailwind, AuthContext + axios interceptor (Bearer token in localStorage), Swiss/Brutalist design system (Chivo + IBM Plex Sans + IBM Plex Mono, Klein-Blue accent on monochrome).
- **Auth**: Stateless JWT (7-day TTL); `Authorization: Bearer <token>` header; idempotent admin & member seeding on startup.

## User Personas
1. **Admin** – creates projects, manages members, creates/assigns/deletes tasks, sees all stats.
2. **Member** – sees only projects they belong to; can update status of tasks assigned to them.

## Core Requirements (Static)
- JWT auth with bcrypt password hashing
- RBAC: admin vs member capability matrix from spec
- CRUD: projects (admin write), tasks (admin write, assignee may change status)
- Members management on a project (add/remove)
- Dashboard stats: total tasks, in-progress, completed, overdue (`due_date < today` & status≠done), my open tasks, total projects
- Protected routes; member can't reach admin-only UI
- Seeded demo accounts for instant testing

## What's Been Implemented (2026-02-15 → 2026-02-16)
- **Backend (live)**: FastAPI on `/api/*` with JWT, RBAC, projects/tasks/dashboard endpoints. 24/24 pytest pass.
- **Backend (parallel Node.js)**: Full Express + Mongoose backend at `/app/backend-node/` matching the README structure (config/, controllers/, middleware/, models/, routes/, server.js). Same `/api/*` contract. Boots, seeds, and authenticates correctly. Ready to push to GitHub / deploy to Railway.
- **Frontend** restructured to README layout: `api/axios.js`, `components/{Sidebar,TaskCard,ProtectedRoute,Layout}.jsx`, `context/{AuthContext,ThemeContext}.jsx`, `pages/{Login,Signup,Dashboard,Projects,Tasks}.jsx`.
- **Dark mode**: ThemeContext + sidebar toggle (desktop + mobile), persisted to `localStorage.ttm_theme`, applied via `html[data-theme]`. Both themes verified visually + by automated regression.
- 100% frontend regression pass on iteration_2.

## Prioritized Backlog
- **P1** Optional: return 403 instead of silent filter when member attempts to PUT non-status task fields
- **P1** Activity log / who-did-what trail per task
- **P2** Task comments
- **P2** Email/notification on assignment & overdue
- **P2** Drag-and-drop status board
- **P2** Filter / search on Projects + Tasks
- **P2** Avatar upload + per-user color
- **P3** Pin origins on CORS for prod, secret rotation playbook
- **P3** Split `server.py` into routers (auth/projects/tasks/dashboard) once >700 LoC

## Test Credentials
See `/app/memory/test_credentials.md`.
