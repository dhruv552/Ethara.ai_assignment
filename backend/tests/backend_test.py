"""Team Task Manager - Backend API tests (pytest)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to reading from frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
ADMIN = {"email": "admin@example.com", "password": "admin123"}
MEMBER = {"email": "member@example.com", "password": "member123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def admin_auth():
    return _login(ADMIN)


@pytest.fixture(scope="session")
def member_auth():
    return _login(MEMBER)


@pytest.fixture(scope="session")
def admin_headers(admin_auth):
    return {"Authorization": f"Bearer {admin_auth['token']}"}


@pytest.fixture(scope="session")
def member_headers(member_auth):
    return {"Authorization": f"Bearer {member_auth['token']}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_admin(self, admin_auth):
        assert admin_auth["user"]["role"] == "admin"
        assert admin_auth["user"]["email"] == "admin@example.com"
        assert isinstance(admin_auth["token"], str) and admin_auth["token"]

    def test_login_member(self, member_auth):
        assert member_auth["user"]["role"] == "member"

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)

    def test_me_with_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_signup_new_user(self):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/signup", json={
            "name": "TEST User", "email": email, "password": "pass1234", "role": "member"
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"].lower() == email.lower()
        assert data["user"]["role"] == "member"
        assert data["token"]


# ---------- Projects ----------
class TestProjects:
    def test_list_projects_admin(self, admin_headers):
        r = requests.get(f"{API}/projects", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_projects_member(self, member_headers):
        r = requests.get(f"{API}/projects", headers=member_headers, timeout=15)
        assert r.status_code == 200

    def test_member_cannot_create_project(self, member_headers):
        r = requests.post(f"{API}/projects", headers=member_headers,
                          json={"name": "TEST_should_fail", "description": ""}, timeout=15)
        assert r.status_code == 403

    def test_admin_create_update_delete_project(self, admin_headers):
        # CREATE
        r = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_Project", "description": "desc"}, timeout=15)
        assert r.status_code == 200, r.text
        p = r.json()
        pid = p["id"]
        assert p["name"] == "TEST_Project"

        # GET persistence
        g = requests.get(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_Project"

        # UPDATE
        u = requests.put(f"{API}/projects/{pid}", headers=admin_headers,
                         json={"name": "TEST_Project_Updated"}, timeout=15)
        assert u.status_code == 200
        assert u.json()["name"] == "TEST_Project_Updated"

        # Verify persisted
        g2 = requests.get(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)
        assert g2.json()["name"] == "TEST_Project_Updated"

        # DELETE
        d = requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)
        assert d.status_code == 200
        gd = requests.get(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)
        assert gd.status_code == 404

    def test_member_cannot_view_unrelated_project(self, admin_headers, member_headers, admin_auth):
        # Create a project and DO NOT add member; admin is auto-added as member; member is not.
        r = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_Private", "description": ""}, timeout=15)
        pid = r.json()["id"]
        try:
            g = requests.get(f"{API}/projects/{pid}", headers=member_headers, timeout=15)
            assert g.status_code == 403
        finally:
            requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)

    def test_member_cannot_update_project(self, admin_headers, member_headers):
        r = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_PUT", "description": ""}, timeout=15)
        pid = r.json()["id"]
        try:
            u = requests.put(f"{API}/projects/{pid}", headers=member_headers,
                             json={"name": "hack"}, timeout=15)
            assert u.status_code == 403
        finally:
            requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)

    def test_add_remove_member(self, admin_headers, member_auth):
        r = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_Members", "description": ""}, timeout=15)
        pid = r.json()["id"]
        member_id = member_auth["user"]["id"]
        try:
            a = requests.post(f"{API}/projects/{pid}/members", headers=admin_headers,
                              json={"user_id": member_id}, timeout=15)
            assert a.status_code == 200
            assert member_id in a.json()["members"]

            d = requests.delete(f"{API}/projects/{pid}/members/{member_id}",
                                headers=admin_headers, timeout=15)
            assert d.status_code == 200
            assert member_id not in d.json()["members"]
        finally:
            requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)


# ---------- Tasks ----------
class TestTasks:
    @pytest.fixture(scope="class")
    def test_project(self, admin_headers, member_auth):
        r = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_TaskProj", "description": ""}, timeout=15)
        pid = r.json()["id"]
        # Add the member to project
        requests.post(f"{API}/projects/{pid}/members", headers=admin_headers,
                      json={"user_id": member_auth["user"]["id"]}, timeout=15)
        yield pid
        requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)

    def test_member_cannot_create_task(self, member_headers, test_project):
        r = requests.post(f"{API}/tasks", headers=member_headers,
                          json={"title": "TEST_fail", "project_id": test_project}, timeout=15)
        assert r.status_code == 403

    def test_admin_create_task(self, admin_headers, test_project, member_auth):
        r = requests.post(f"{API}/tasks", headers=admin_headers, json={
            "title": "TEST_Task",
            "description": "d",
            "project_id": test_project,
            "assigned_to": member_auth["user"]["id"],
            "status": "todo",
            "due_date": "2020-01-01",  # past => overdue
        }, timeout=15)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["title"] == "TEST_Task"
        assert t["status"] == "todo"
        pytest.task_id = t["id"]

    def test_list_project_tasks(self, admin_headers, test_project):
        r = requests.get(f"{API}/tasks/project/{test_project}", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert any(t["id"] == pytest.task_id for t in r.json())

    def test_list_mine(self, member_headers):
        r = requests.get(f"{API}/tasks/mine", headers=member_headers, timeout=15)
        assert r.status_code == 200
        assert any(t["id"] == pytest.task_id for t in r.json())

    def test_assignee_can_update_status_only(self, member_headers):
        # valid: status update
        r = requests.put(f"{API}/tasks/{pytest.task_id}", headers=member_headers,
                         json={"status": "in-progress"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "in-progress"
        # invalid field silently filtered
        r2 = requests.put(f"{API}/tasks/{pytest.task_id}", headers=member_headers,
                          json={"title": "hacked"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_Task"  # unchanged

    def test_non_assignee_member_forbidden(self, admin_headers, test_project):
        # Create task assigned to admin; member is not assignee
        r = requests.post(f"{API}/tasks", headers=admin_headers, json={
            "title": "TEST_AdminOnly", "project_id": test_project,
            "status": "todo"
        }, timeout=15)
        tid = r.json()["id"]
        # Re-login member
        m = _login(MEMBER)
        mh = {"Authorization": f"Bearer {m['token']}"}
        u = requests.put(f"{API}/tasks/{tid}", headers=mh, json={"status": "done"}, timeout=15)
        assert u.status_code == 403
        requests.delete(f"{API}/tasks/{tid}", headers=admin_headers, timeout=15)

    def test_admin_delete_task(self, admin_headers):
        r = requests.delete(f"{API}/tasks/{pytest.task_id}", headers=admin_headers, timeout=15)
        assert r.status_code == 200

    def test_member_cannot_delete(self, admin_headers, member_headers, test_project):
        r = requests.post(f"{API}/tasks", headers=admin_headers, json={
            "title": "TEST_DelFail", "project_id": test_project, "status": "todo"
        }, timeout=15)
        tid = r.json()["id"]
        d = requests.delete(f"{API}/tasks/{tid}", headers=member_headers, timeout=15)
        assert d.status_code == 403
        requests.delete(f"{API}/tasks/{tid}", headers=admin_headers, timeout=15)


# ---------- Dashboard ----------
class TestDashboard:
    def test_stats_admin(self, admin_headers):
        r = requests.get(f"{API}/dashboard/stats", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_projects", "total_tasks", "completed_tasks",
                  "in_progress_tasks", "overdue_tasks", "my_open_tasks"):
            assert k in d
            assert isinstance(d[k], int)

    def test_stats_member(self, member_headers):
        r = requests.get(f"{API}/dashboard/stats", headers=member_headers, timeout=15)
        assert r.status_code == 200

    def test_overdue_computation(self, admin_headers, test_project_for_overdue=None):
        # Create project + overdue task, verify overdue >= 1
        p = requests.post(f"{API}/projects", headers=admin_headers,
                          json={"name": "TEST_Overdue", "description": ""}, timeout=15).json()
        pid = p["id"]
        t = requests.post(f"{API}/tasks", headers=admin_headers, json={
            "title": "TEST_Overdue_Task", "project_id": pid,
            "due_date": "2020-01-01", "status": "todo",
        }, timeout=15).json()
        try:
            s = requests.get(f"{API}/dashboard/stats", headers=admin_headers, timeout=15).json()
            assert s["overdue_tasks"] >= 1
        finally:
            requests.delete(f"{API}/tasks/{t['id']}", headers=admin_headers, timeout=15)
            requests.delete(f"{API}/projects/{pid}", headers=admin_headers, timeout=15)
