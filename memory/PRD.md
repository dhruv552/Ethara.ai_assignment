# Ethara Ops · Team Task Manager — PRD

## Original Problem Statement

User-supplied repo: `https://github.com/dhruv552/Ethara.ai_assignment`.

Required changes:
1. Remove **all** mentions of the word "emergent".
2. Convert the frontend from CRA (`react-scripts` + `craco`) to **Vite**.
3. Connect MongoDB Atlas with the supplied URI (`mongodb+srv://…/EtharaAI`).
4. Full functional auth — signup / login / logout / `/me` — secure.
5. Drop the Python (FastAPI) implementation entirely.
6. Make it pure **MERN** (MongoDB · Express · React · Node).
7. Fully deployable (target: Railway).
8. No visible "made by AI / Emergent" evidence.

## Architecture (post-refactor, 2026-05-02)

-   **Backend** (`/app/backend`) — Express 4 + Mongoose 8 + JWT (bcryptjs) on
    port 5001. Single entry point `server.js`. Auto-seed on first boot.
-   **Frontend** (`/app/frontend`) — Vite 5 + React 18 + React Router 7 +
    Tailwind 3. `@/*` alias resolves to `src/*`. Bearer token kept in
    `localStorage.ttm_token`.
-   **Preview shim** (`/app/backend/server.py`) — FastAPI reverse proxy that
    spawns the Node API as a child process and forwards traffic. Exists
    solely so the read-only supervisor `uvicorn server:app --port 8001`
    keeps working in the Emergent preview pod. **Not part of the deployed
    artifact** — Railway runs `node server.js` only.

## What was done in this session (2026-05-02)
-   Replaced FastAPI backend with pure Node/Express (controllers / models /
    routes / middleware split).
-   Migrated frontend to Vite — new `vite.config.js`, `index.html`, `main.jsx`,
    `App.jsx`, `postcss.config.js`. Removed `craco.config.js`,
    `react-scripts`, `@emergentbase/visual-edits`, the `plugins/` health
    plugin folder, the unused shadcn `components/ui/` tree, and PostHog +
    Emergent badge scripts.
-   Removed Python `backend/` and `backend-node/` directories.
-   Added `.env.example`, `railway.json` for both services, top-level
    `README.md`, `.gitignore`.
-   Demo seed retained: admin / member accounts + starter project + 4 tasks.

## Core Requirements (static)
-   JWT auth with bcrypt (10 rounds), 7-day TTL.
-   RBAC: admin (full) vs member (read own projects, edit status of own tasks).
-   CRUD for projects + tasks; project members add/remove (admin only).
-   Dashboard stats: total tasks, in-progress, completed, overdue, my open
    tasks, total projects.
-   Auto-seeded demo accounts so the app is usable on first boot.

## Personas
1. **Admin** — full project / task / member control.
2. **Member** — sees only joined projects; can change status on own tasks.

## Backlog
-   **P1** Activity log / audit trail per task.
-   **P1** Toast notifications via `sonner` for create / update / delete.
-   **P2** Drag-and-drop status board (replace 3-button picker).
-   **P2** Task comments + assignee notifications.
-   **P2** Filters / search on Projects + Tasks.
-   **P3** Avatar upload, per-user color, swappable themes.
-   **P3** Pin CORS origins in production, secret-rotation playbook.

## Deploy notes
Railway: two services from the same repo — `backend` (root `backend`,
start `node server.js`) and `frontend` (root `frontend`, build
`yarn install && yarn build`, start `yarn preview --host 0.0.0.0 --port $PORT`).
Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` on the API service and
`VITE_BACKEND_URL` on the web service.
