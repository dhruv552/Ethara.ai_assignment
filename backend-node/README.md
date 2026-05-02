# Team Task Manager — Node.js Backend

Express + Mongoose backend matching the README structure. The live preview in
this Emergent workspace runs an equivalent FastAPI backend (same `/api/*`
contract). This Node version is for GitHub / Railway deployment.

## Quick Start

```bash
cd backend-node
cp .env.example .env   # edit MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev            # http://localhost:5000
```

On first start the server seeds:
- `admin@example.com / admin123` (admin)
- `member@example.com / member123` (member)
- 1 starter project + 4 tasks

## Folder structure

```
backend-node/
├── config/db.js
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   └── taskController.js
├── middleware/
│   ├── auth.js
│   └── roleCheck.js
├── models/
│   ├── User.js
│   ├── Project.js
│   └── Task.js
├── routes/
│   ├── auth.js
│   ├── projects.js
│   ├── tasks.js
│   └── misc.js   (/users, /dashboard/stats)
├── server.js
└── package.json
```

## API

| Method | Path | Auth | Role |
|---|---|---|---|
| POST | /api/auth/signup | – | – |
| POST | /api/auth/login | – | – |
| GET | /api/auth/me | ✅ | – |
| POST | /api/auth/logout | ✅ | – |
| GET | /api/users | ✅ | – |
| POST | /api/projects | ✅ | admin |
| GET | /api/projects | ✅ | – |
| GET | /api/projects/:id | ✅ | – |
| PUT | /api/projects/:id | ✅ | admin |
| DELETE | /api/projects/:id | ✅ | admin |
| POST | /api/projects/:id/members | ✅ | admin |
| DELETE | /api/projects/:id/members/:userId | ✅ | admin |
| POST | /api/tasks | ✅ | admin |
| GET | /api/tasks/mine | ✅ | – |
| GET | /api/tasks/project/:id | ✅ | – |
| PUT | /api/tasks/:id | ✅ | admin or assignee |
| DELETE | /api/tasks/:id | ✅ | admin |
| GET | /api/dashboard/stats | ✅ | – |

Auth header: `Authorization: Bearer <jwt>`.
