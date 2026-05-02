from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Team Task Manager API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_DAYS = 7

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ttm")


# ---------------------------------------------------------------------------
# Security helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_TTL_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    token: Optional[str] = None
    if creds and creds.scheme.lower() == "bearer":
        token = creds.credentials
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
Role = Literal["admin", "member"]
TaskStatus = Literal["todo", "in-progress", "done"]


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Role = "member"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: EmailStr
    role: Role
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)


class MemberPayload(BaseModel):
    user_id: str


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    created_by: str
    members: List[str]
    created_at: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    project_id: str
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None  # ISO date string
    status: TaskStatus = "todo"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[TaskStatus] = None


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    project_id: str
    assigned_to: Optional[str]
    status: TaskStatus
    due_date: Optional[str]
    created_by: str
    created_at: str


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    token = create_access_token(user_id, email, payload.role)
    return AuthResponse(token=token, user=UserPublic(**user_doc))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user["role"])
    public = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return AuthResponse(token=token, user=UserPublic(**public))


@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(user: dict = Depends(get_current_user)):
    return UserPublic(**user)


@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    # Stateless JWT: client just discards token. Endpoint kept for symmetry.
    return {"ok": True}


# ---------------------------------------------------------------------------
# Users (lookup for member assignment)
# ---------------------------------------------------------------------------
@api_router.get("/users", response_model=List[UserPublic])
async def list_users(user: dict = Depends(get_current_user)):
    cursor = db.users.find({}, {"_id": 0, "password_hash": 0})
    return [UserPublic(**u) async for u in cursor]


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
async def _project_or_404(project_id: str) -> dict:
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _user_can_view_project(user: dict, project: dict) -> bool:
    if user.get("role") == "admin":
        return True
    return user["id"] in project.get("members", []) or project.get("created_by") == user["id"]


@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, user: dict = Depends(require_admin)):
    project_id = str(uuid.uuid4())
    doc = {
        "id": project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "created_by": user["id"],
        "members": [user["id"]],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return Project(**doc)


@api_router.get("/projects", response_model=List[Project])
async def list_projects(user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        cursor = db.projects.find({}, {"_id": 0})
    else:
        cursor = db.projects.find(
            {"$or": [{"members": user["id"]}, {"created_by": user["id"]}]},
            {"_id": 0},
        )
    return [Project(**p) async for p in cursor]


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await _project_or_404(project_id)
    if not _user_can_view_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")
    return Project(**project)


@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: dict = Depends(require_admin),
):
    project = await _project_or_404(project_id)
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        await db.projects.update_one({"id": project_id}, {"$set": update})
        project.update(update)
    return Project(**project)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(require_admin)):
    await _project_or_404(project_id)
    await db.projects.delete_one({"id": project_id})
    await db.tasks.delete_many({"project_id": project_id})
    return {"ok": True}


@api_router.post("/projects/{project_id}/members", response_model=Project)
async def add_member(
    project_id: str,
    payload: MemberPayload,
    user: dict = Depends(require_admin),
):
    project = await _project_or_404(project_id)
    target = await db.users.find_one({"id": payload.user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.user_id in project.get("members", []):
        return Project(**project)
    await db.projects.update_one(
        {"id": project_id}, {"$addToSet": {"members": payload.user_id}}
    )
    project["members"] = project.get("members", []) + [payload.user_id]
    return Project(**project)


@api_router.delete("/projects/{project_id}/members/{user_id}", response_model=Project)
async def remove_member(
    project_id: str,
    user_id: str,
    user: dict = Depends(require_admin),
):
    project = await _project_or_404(project_id)
    await db.projects.update_one(
        {"id": project_id}, {"$pull": {"members": user_id}}
    )
    project["members"] = [m for m in project.get("members", []) if m != user_id]
    return Project(**project)


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
async def _task_or_404(task_id: str) -> dict:
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate, user: dict = Depends(require_admin)):
    project = await _project_or_404(payload.project_id)
    if payload.assigned_to:
        assignee = await db.users.find_one({"id": payload.assigned_to}, {"_id": 0})
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        if assignee["id"] not in project.get("members", []):
            await db.projects.update_one(
                {"id": project["id"]}, {"$addToSet": {"members": assignee["id"]}}
            )
    task_id = str(uuid.uuid4())
    doc = {
        "id": task_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "project_id": payload.project_id,
        "assigned_to": payload.assigned_to,
        "status": payload.status,
        "due_date": payload.due_date,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return Task(**doc)


@api_router.get("/tasks/project/{project_id}", response_model=List[Task])
async def list_project_tasks(project_id: str, user: dict = Depends(get_current_user)):
    project = await _project_or_404(project_id)
    if not _user_can_view_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")
    cursor = db.tasks.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1)
    return [Task(**t) async for t in cursor]


@api_router.get("/tasks/mine", response_model=List[Task])
async def list_my_tasks(user: dict = Depends(get_current_user)):
    cursor = db.tasks.find({"assigned_to": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return [Task(**t) async for t in cursor]


@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user: dict = Depends(get_current_user),
):
    task = await _task_or_404(task_id)
    is_admin = user.get("role") == "admin"
    is_assignee = task.get("assigned_to") == user["id"]
    if not (is_admin or is_assignee):
        raise HTTPException(status_code=403, detail="Forbidden")

    data = payload.model_dump(exclude_unset=True)
    # Members can only update status
    if not is_admin:
        data = {k: v for k, v in data.items() if k == "status"}
    if not data:
        return Task(**task)

    await db.tasks.update_one({"id": task_id}, {"$set": data})
    task.update(data)
    return Task(**task)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(require_admin)):
    await _task_or_404(task_id)
    await db.tasks.delete_one({"id": task_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@api_router.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    is_admin = user.get("role") == "admin"

    if is_admin:
        project_filter: dict = {}
        task_filter: dict = {}
    else:
        cursor = db.projects.find(
            {"$or": [{"members": user["id"]}, {"created_by": user["id"]}]},
            {"_id": 0, "id": 1},
        )
        proj_ids = [p["id"] async for p in cursor]
        project_filter = {"id": {"$in": proj_ids}}
        task_filter = {
            "$or": [
                {"assigned_to": user["id"]},
                {"project_id": {"$in": proj_ids}},
            ]
        }

    total_projects = await db.projects.count_documents(project_filter)
    total_tasks = await db.tasks.count_documents(task_filter)
    completed_tasks = await db.tasks.count_documents({**task_filter, "status": "done"})
    in_progress_tasks = await db.tasks.count_documents(
        {**task_filter, "status": "in-progress"}
    )

    today_iso = datetime.now(timezone.utc).date().isoformat()
    overdue_filter = {
        **task_filter,
        "status": {"$ne": "done"},
        "due_date": {"$lt": today_iso, "$ne": None},
    }
    overdue_tasks = await db.tasks.count_documents(overdue_filter)

    my_open_tasks = await db.tasks.count_documents(
        {"assigned_to": user["id"], "status": {"$ne": "done"}}
    )

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "overdue_tasks": overdue_tasks,
        "my_open_tasks": my_open_tasks,
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"service": "team-task-manager", "ok": True}


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
async def _ensure_user(name: str, email: str, password: str, role: str) -> str:
    existing = await db.users.find_one({"email": email})
    if existing is None:
        user_id = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "id": user_id,
                "name": name,
                "email": email,
                "password_hash": hash_password(password),
                "role": role,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info("Seeded user %s (%s)", email, role)
        return user_id
    # Refresh password if env value changed
    if not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email}, {"$set": {"password_hash": hash_password(password)}}
        )
    return existing["id"]


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.projects.create_index("id", unique=True)
    await db.tasks.create_index("id", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    member_email = os.environ.get("MEMBER_EMAIL", "member@example.com")
    member_password = os.environ.get("MEMBER_PASSWORD", "member123")

    admin_id = await _ensure_user("Admin User", admin_email, admin_password, "admin")
    member_id = await _ensure_user("Team Member", member_email, member_password, "member")

    # Seed a starter project + tasks if no projects exist
    if await db.projects.count_documents({}) == 0:
        proj_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        await db.projects.insert_one(
            {
                "id": proj_id,
                "name": "Website Relaunch",
                "description": "Rebuild marketing site with new brand system.",
                "created_by": admin_id,
                "members": [admin_id, member_id],
                "created_at": now.isoformat(),
            }
        )
        sample = [
            {
                "title": "Audit current site",
                "description": "Inventory pages and content gaps.",
                "status": "done",
                "assigned_to": admin_id,
                "due_date": (now - timedelta(days=2)).date().isoformat(),
            },
            {
                "title": "Design system tokens",
                "description": "Define type, color, spacing tokens.",
                "status": "in-progress",
                "assigned_to": member_id,
                "due_date": (now + timedelta(days=3)).date().isoformat(),
            },
            {
                "title": "Build homepage hero",
                "description": "Implement responsive hero section.",
                "status": "todo",
                "assigned_to": member_id,
                "due_date": (now + timedelta(days=7)).date().isoformat(),
            },
            {
                "title": "Migrate blog posts",
                "description": "Move existing blog content to CMS.",
                "status": "todo",
                "assigned_to": None,
                "due_date": (now - timedelta(days=1)).date().isoformat(),
            },
        ]
        for t in sample:
            await db.tasks.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "title": t["title"],
                    "description": t["description"],
                    "project_id": proj_id,
                    "assigned_to": t["assigned_to"],
                    "status": t["status"],
                    "due_date": t["due_date"],
                    "created_by": admin_id,
                    "created_at": now.isoformat(),
                }
            )
        logger.info("Seeded starter project + tasks")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
