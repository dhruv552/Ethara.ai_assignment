# Ethara Ops · Team Task Manager

A pure **MERN** (MongoDB + Express + React + Node.js) team task manager with
JWT auth, role-based access (admin / member), projects, tasks, and a live
dashboard. Frontend is built with **Vite + React 18 + Tailwind**, backend with
**Express + Mongoose**.

## Stack

-   **Backend** — Node.js · Express · Mongoose · JSON Web Tokens · bcryptjs
-   **Frontend** — Vite · React 18 · React Router 7 · Tailwind CSS · Axios
-   **Database** — MongoDB (Atlas or self-hosted)

## Repo layout

```
.
├── backend/             # Express + Mongoose API
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/seed.js
│   ├── server.js
│   └── package.json
├── frontend/            # Vite + React app
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Getting started

### 1. Prerequisites

-   Node.js ≥ 18
-   A MongoDB connection string (Atlas works out of the box)
-   `yarn` or `npm`

### 2. Backend

```bash
cd backend
cp .env.example .env       # then fill in values
yarn install
yarn start                  # listens on PORT (default 5001)
```

`.env` keys:

| key              | example                                            |
| ---------------- | -------------------------------------------------- |
| `MONGO_URI`      | `mongodb+srv://user:pass@host/EtharaAI`            |
| `PORT`           | `5001`                                             |
| `JWT_SECRET`     | a long random hex string                           |
| `JWT_EXPIRES_IN` | `7d`                                               |
| `CLIENT_URL`     | `https://your-frontend.example.com` (or `*`)       |
| `ADMIN_EMAIL`    | `admin@example.com` (seeded on first boot)         |
| `ADMIN_PASSWORD` | `admin123` (change in production)                  |
| `MEMBER_EMAIL`   | `member@example.com`                               |
| `MEMBER_PASSWORD`| `member123`                                        |

The first boot auto-seeds an admin, a member, and a starter project + four
tasks if the collections are empty.

### 3. Frontend

```bash
cd frontend
yarn install
echo "VITE_BACKEND_URL=http://localhost:5001" > .env
yarn dev                    # http://localhost:3000
```

`yarn build` produces a static bundle in `frontend/dist/` ready for any CDN.

## Demo credentials (seeded)

| role   | email                | password    |
| ------ | -------------------- | ----------- |
| admin  | admin@example.com    | admin123    |
| member | member@example.com   | member123   |

## API surface (`/api`)

| method | path                                   | role  | description              |
| ------ | -------------------------------------- | ----- | ------------------------ |
| POST   | `/auth/signup`                         | -     | register + receive JWT   |
| POST   | `/auth/login`                          | -     | login + receive JWT      |
| GET    | `/auth/me`                             | auth  | current user             |
| POST   | `/auth/logout`                         | auth  | client-side token drop   |
| GET    | `/users`                               | auth  | list all users           |
| GET    | `/dashboard/stats`                     | auth  | counts for the dashboard |
| GET    | `/projects`                            | auth  | visible projects         |
| POST   | `/projects`                            | admin | create project           |
| GET    | `/projects/:id`                        | auth  | project detail           |
| PUT    | `/projects/:id`                        | admin | edit project             |
| DELETE | `/projects/:id`                        | admin | delete project + tasks   |
| POST   | `/projects/:id/members`                | admin | add member               |
| DELETE | `/projects/:id/members/:userId`        | admin | remove member            |
| POST   | `/tasks`                               | admin | create task              |
| GET    | `/tasks/mine`                          | auth  | tasks assigned to me     |
| GET    | `/tasks/project/:id`                   | auth  | tasks in a project       |
| PUT    | `/tasks/:id`                           | auth  | update (member: status only) |
| DELETE | `/tasks/:id`                           | admin | delete task              |

## Deploy on Railway

1. Push this repo to GitHub.
2. In Railway, create **two services** from the same repo:
   -   **api** — Root directory: `backend`. Start command: `node server.js`.
       Add the env keys from the table above. Expose service network port =
       value of `PORT`.
   -   **web** — Root directory: `frontend`. Build command: `yarn build`.
       Start command: `yarn preview --host 0.0.0.0 --port $PORT`. Add
       `VITE_BACKEND_URL=https://<api-service-domain>`.
3. Re-deploy. The `web` service will route all `/api/*` requests to the `api`
   service domain via `VITE_BACKEND_URL`.

You can also put the React build behind any static host (Netlify, Vercel,
Cloudflare Pages) and keep only the `api` on Railway.

## License

MIT
