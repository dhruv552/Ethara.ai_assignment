# Team Task Manager — Full-Stack Web Application

A full-stack web app that lets teams create projects, assign tasks, and stay on top of deadlines — all with proper role-based access so the right people have the right controls.

Built with the **MERN stack** (MongoDB, Express, React, Node.js), with JWT-based authentication, a live dashboard, and clean REST APIs throughout. Deployed on **Railway + Vercel**.

🔗 **Live App:** [ethara-ai-assignment-two.vercel.app](https://ethara-ai-assignment-two.vercel.app)
📁 **GitHub Repo:** [github.com/dhruv552/Ethara.ai_assignment](https://github.com/dhruv552/Ethara.ai_assignment)

---

## What It Does

This app gives teams a central place to manage work — without the chaos of spreadsheets or endless messages. Here's what you get out of the box:

- **Sign up & log in** with secure JWT-based authentication
- **Create projects** and add team members to them
- **Assign tasks** with due dates, priorities, and assignees
- **Track task status** — from to-do to in-progress to done
- **Dashboard overview** showing total tasks, completed, overdue, and in-progress counts
- **Role-based access control** — admins manage everything, members update their own tasks
- **Auto-seeded data** on first boot so you're not staring at an empty screen

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 7, Tailwind CSS, Axios |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas or self-hosted) |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Project Structure

```
Ethara.ai_assignment/
├── backend/                  # Express + Mongoose REST API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # Route logic (auth, projects, tasks, users)
│   ├── middleware/           # Auth guard, role check
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── scripts/
│   │   └── seed.js           # Seeds admin, member, project & tasks
│   ├── server.js             # App entry point
│   └── package.json
│
├── frontend/                 # Vite + React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages (Login, Dashboard, Projects, Tasks)
│   │   ├── context/          # Auth context
│   │   └── api/              # Axios instance + API helpers
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started Locally

### Prerequisites

- Node.js **v18 or higher**
- A MongoDB connection string (MongoDB Atlas is easiest)
- `npm` or `yarn`

---

### 1. Clone the Repo

```bash
git clone https://github.com/dhruv552/Ethara.ai_assignment.git
cd Ethara.ai_assignment
```

---

### 2. Set Up the Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Example / Notes |
|---|---|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/EtharaAI` |
| `PORT` | `5001` |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your frontend URL (or `*` for local dev) |
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | `admin123` *(change before going live)* |
| `MEMBER_EMAIL` | `member@example.com` |
| `MEMBER_PASSWORD` | `member123` |

Then start the server:

```bash
npm install
npm start
# Runs on http://localhost:5001
```

> On first boot, the server automatically seeds an admin user, a member user, and a starter project with four tasks — so you can jump in right away.

---

### 3. Set Up the Frontend

```bash
cd frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:5001" > .env
npm run dev
# Runs on http://localhost:3000
```

---

## Demo Credentials (Pre-Seeded)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Member | member@example.com | member123 |

Admins can create/edit/delete projects and tasks, manage team members, and see everything. Members can view their assigned tasks and update statuses.

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register a new user, returns JWT |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Auth | Get current logged-in user |
| POST | `/auth/logout` | Auth | Logout (client-side token drop) |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Auth | List all users (for assignment dropdowns) |

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | Auth | Task counts — total, done, overdue, in-progress |

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/projects` | Auth | List all visible projects |
| POST | `/projects` | Admin | Create a new project |
| GET | `/projects/:id` | Auth | Get project details |
| PUT | `/projects/:id` | Admin | Edit a project |
| DELETE | `/projects/:id` | Admin | Delete project and all its tasks |
| POST | `/projects/:id/members` | Admin | Add a member to the project |
| DELETE | `/projects/:id/members/:userId` | Admin | Remove a member from the project |

### Tasks

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/tasks` | Admin | Create a new task |
| GET | `/tasks/mine` | Auth | Get tasks assigned to the logged-in user |
| GET | `/tasks/project/:id` | Auth | Get all tasks in a specific project |
| PUT | `/tasks/:id` | Auth | Update task (members can only change status) |
| DELETE | `/tasks/:id` | Admin | Delete a task |

---

## Deploying on Railway

The app is split into two Railway services from the same GitHub repo.

### Backend Service

1. Create a new service → connect your GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Start Command** to `node server.js`
4. Add all the environment variables from the table above
5. Note the public domain Railway assigns (you'll need it for the frontend)

### Frontend Service

1. Create another service from the same repo
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Start Command** to `npm run preview -- --host 0.0.0.0 --port $PORT`
5. Add `VITE_BACKEND_URL=https://<your-backend-service-domain>`

> You can also deploy the frontend to **Vercel** or **Netlify** — just set the `VITE_BACKEND_URL` env variable there and keep only the backend on Railway.

---

## Role-Based Access — How It Works

The app has two roles: **Admin** and **Member**.

- **Admins** can create, edit, and delete projects and tasks. They can add or remove members from any project and have full visibility over everything.
- **Members** can view the projects they belong to, see their assigned tasks, and update task statuses. They cannot create or delete projects or tasks.

Role checks happen both on the backend (middleware guards) and on the frontend (conditional rendering), so access is enforced at every layer.

---

## License

MIT — feel free to use this as a starting point for your own projects.