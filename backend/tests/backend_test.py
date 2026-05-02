"""
Backend API tests for Ethara Ops MERN app.
Hits the public preview URL (REACT_APP_BACKEND_URL) → FastAPI shim → Node/Express.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://a709cb7c-d0ce-48fd-8a8b-353c6ee978e1.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@example.com", "password": "admin123"}
MEMBER = {"email": "member@example.com", "password": "member123"}

STATE = {}  # shared across tests


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, creds):
    r = session.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data


# ---------------- Health ----------------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        assert data.get("service") == "ethara-ops"

    def test_health(self, session):
        r = session.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------------- Auth ----------------
class TestAuth:
    def test_login_admin(self, session):
        data = _login(session, ADMIN)
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN["email"]
        STATE["admin_token"] = data["token"]
        STATE["admin_id"] = data["user"]["id"]

    def test_login_member(self, session):
        data = _login(session, MEMBER)
        assert data["user"]["role"] == "member"
        STATE["member_token"] = data["token"]
        STATE["member_id"] = data["user"]["id"]

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "wrong"}, timeout=10)
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_login_missing_fields(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "x@y.com"}, timeout=10)
        assert r.status_code == 400

    def test_signup_and_login(self, session):
        unique = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"name": "TEST User", "email": unique, "password": "pass1234"}
        r = session.post(f"{API}/auth/signup", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == unique
        assert data["user"]["role"] == "member"  # role should default, not be admin
        assert "token" in data
        STATE["new_user_token"] = data["token"]
        STATE["new_user_id"] = data["user"]["id"]
        STATE["new_user_email"] = unique

        # duplicate signup
        r2 = session.post(f"{API}/auth/signup", json=payload, timeout=10)
        assert r2.status_code == 400

    def test_signup_short_password(self, session):
        r = session.post(
            f"{API}/auth/signup",
            json={"name": "x", "email": f"t_{uuid.uuid4().hex[:6]}@e.com", "password": "12"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_me_with_token(self, session):
        token = STATE["admin_token"]
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN["email"]

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_invalid_token(self, session):
        r = session.get(f"{API}/auth/me", headers={"Authorization": "Bearer bogus.token.here"}, timeout=10)
        assert r.status_code == 401

    def test_logout(self, session):
        token = STATE["admin_token"]
        r = session.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------- Users + Dashboard ----------------
class TestMisc:
    def test_list_users_requires_auth(self, session):
        r = session.get(f"{API}/users", timeout=10)
        assert r.status_code == 401

    def test_list_users_as_admin(self, session):
        token = STATE["admin_token"]
        r = session.get(f"{API}/users", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        emails = [u["email"] for u in users]
        assert ADMIN["email"] in emails
        assert MEMBER["email"] in emails

    def test_dashboard_stats_admin(self, session):
        token = STATE["admin_token"]
        r = session.get(f"{API}/dashboard/stats", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        stats = r.json()
        for k in ["total_projects", "total_tasks", "completed_tasks",
                  "in_progress_tasks", "overdue_tasks", "my_open_tasks"]:
            assert k in stats
            assert isinstance(stats[k], int)

    def test_dashboard_stats_member(self, session):
        token = STATE["member_token"]
        r = session.get(f"{API}/dashboard/stats", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        assert "total_projects" in r.json()


# ---------------- Projects CRUD ----------------
class TestProjects:
    def test_admin_create_project(self, session):
        token = STATE["admin_token"]
        payload = {"name": f"TEST Project {uuid.uuid4().hex[:6]}", "description": "test desc"}
        r = session.post(f"{API}/projects", json=payload,
                         headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200, r.text
        project = r.json()
        assert project["name"] == payload["name"]
        assert "id" in project
        STATE["project_id"] = project["id"]

        # GET to verify persistence
        g = session.get(f"{API}/projects/{project['id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert g.status_code == 200
        assert g.json()["name"] == payload["name"]

    def test_member_cannot_create_project(self, session):
        token = STATE["member_token"]
        r = session.post(f"{API}/projects", json={"name": "TEST forbidden"},
                         headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 403

    def test_list_projects_admin(self, session):
        token = STATE["admin_token"]
        r = session.get(f"{API}/projects", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert any(p["id"] == STATE["project_id"] for p in r.json())

    def test_member_cannot_see_admin_only_project(self, session):
        # Member is not added to the TEST project → should NOT see it in list or get
        token = STATE["member_token"]
        r = session.get(f"{API}/projects", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert STATE["project_id"] not in ids

        g = session.get(f"{API}/projects/{STATE['project_id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert g.status_code == 403

    def test_admin_add_member(self, session):
        token = STATE["admin_token"]
        r = session.post(
            f"{API}/projects/{STATE['project_id']}/members",
            json={"user_id": STATE["member_id"]},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r.status_code == 200
        members = r.json().get("members", [])
        assert STATE["member_id"] in members

    def test_member_can_now_view(self, session):
        token = STATE["member_token"]
        g = session.get(f"{API}/projects/{STATE['project_id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert g.status_code == 200

    def test_admin_update_project(self, session):
        token = STATE["admin_token"]
        new_name = f"TEST Renamed {uuid.uuid4().hex[:4]}"
        r = session.put(
            f"{API}/projects/{STATE['project_id']}",
            json={"name": new_name, "description": "updated"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r.status_code == 200
        assert r.json()["name"] == new_name

        g = session.get(f"{API}/projects/{STATE['project_id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert g.json()["name"] == new_name

    def test_member_cannot_update(self, session):
        token = STATE["member_token"]
        r = session.put(f"{API}/projects/{STATE['project_id']}", json={"name": "hack"},
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 403


# ---------------- Tasks CRUD ----------------
class TestTasks:
    def test_admin_create_task_for_member(self, session):
        token = STATE["admin_token"]
        payload = {
            "title": "TEST Task",
            "description": "do the thing",
            "project_id": STATE["project_id"],
            "assigned_to": STATE["member_id"],
            "status": "todo",
        }
        r = session.post(f"{API}/tasks", json=payload,
                         headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200, r.text
        task = r.json()
        assert task["title"] == payload["title"]
        assert task.get("assigned_to") == STATE["member_id"] or task.get("assignedTo") == STATE["member_id"]
        STATE["task_id"] = task["id"]

    def test_member_cannot_create_task(self, session):
        token = STATE["member_token"]
        r = session.post(f"{API}/tasks", json={"title": "x", "project_id": STATE["project_id"]},
                         headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 403

    def test_list_tasks_by_project(self, session):
        token = STATE["admin_token"]
        r = session.get(f"{API}/tasks/project/{STATE['project_id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        tasks = r.json()
        assert any(t["id"] == STATE["task_id"] for t in tasks)

    def test_tasks_mine_for_member(self, session):
        token = STATE["member_token"]
        r = session.get(f"{API}/tasks/mine",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        ids = [t["id"] for t in r.json()]
        assert STATE["task_id"] in ids

    def test_member_can_update_status_of_own_task(self, session):
        token = STATE["member_token"]
        r = session.put(f"{API}/tasks/{STATE['task_id']}",
                        json={"status": "in-progress"},
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "in-progress"

    def test_member_cannot_update_unassigned_task(self, session):
        # Create a second task unassigned
        token_a = STATE["admin_token"]
        r = session.post(f"{API}/tasks",
                         json={"title": "TEST Unassigned", "project_id": STATE["project_id"]},
                         headers={"Authorization": f"Bearer {token_a}"}, timeout=10)
        assert r.status_code == 200
        other_id = r.json()["id"]
        STATE["other_task_id"] = other_id

        token_m = STATE["member_token"]
        r = session.put(f"{API}/tasks/{other_id}",
                        json={"status": "done"},
                        headers={"Authorization": f"Bearer {token_m}"}, timeout=10)
        assert r.status_code == 403

    def test_member_cannot_delete_task(self, session):
        token = STATE["member_token"]
        r = session.delete(f"{API}/tasks/{STATE['task_id']}",
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 403

    def test_admin_delete_task(self, session):
        token = STATE["admin_token"]
        r = session.delete(f"{API}/tasks/{STATE['task_id']}",
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200

        r2 = session.delete(f"{API}/tasks/{STATE.get('other_task_id')}",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 200


# ---------------- Teardown: delete test project ----------------
class TestZCleanup:
    def test_remove_member_and_delete_project(self, session):
        token = STATE["admin_token"]
        # remove member
        r = session.delete(
            f"{API}/projects/{STATE['project_id']}/members/{STATE['member_id']}",
            headers={"Authorization": f"Bearer {token}"}, timeout=10,
        )
        assert r.status_code == 200

        # delete project
        r = session.delete(f"{API}/projects/{STATE['project_id']}",
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r.status_code == 200

        # verify 404
        g = session.get(f"{API}/projects/{STATE['project_id']}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert g.status_code == 404
