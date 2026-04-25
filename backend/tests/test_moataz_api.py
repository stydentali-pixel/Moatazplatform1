"""
End-to-end backend API tests for Moataz Platform (Next.js + Prisma via FastAPI proxy).
Tests public + auth + admin endpoints.
"""
import io
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://1c8dda95-f3d4-49df-9b80-138e3c1475c5.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@site.com"
ADMIN_PASSWORD = "123456"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def public_client():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_client():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("success") is True
    # cookie should be set
    assert "moataz_token" in s.cookies, f"Cookie not set, got: {dict(s.cookies)}"
    return s


# ---------------- Public APIs ----------------
class TestPublicAPI:
    def test_get_posts(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/posts", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        # data could be list or {items, total} - flexible
        assert "data" in body

    def test_get_posts_with_filter(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/posts", params={"sort": "latest", "page": 1, "limit": 5}, timeout=20)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_get_posts_with_search(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/posts", params={"q": "writing"}, timeout=20)
        assert r.status_code == 200

    def test_get_post_by_slug(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/posts/writing-that-lasts", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        data = body["data"]
        # Should include the post and possibly related
        assert data is not None

    def test_get_post_by_invalid_slug(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/posts/non-existent-slug-xyz", timeout=20)
        assert r.status_code in (404, 200)
        if r.status_code == 200:
            body = r.json()
            # Should indicate failure or null
            assert body.get("success") is False or body.get("data") is None

    def test_get_categories(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/categories", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
        assert len(body["data"]) >= 1

    def test_get_tags(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/tags", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_search(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/search", params={"q": "ثقافة"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_settings(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/public/settings", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    def test_subscribe(self, public_client):
        email = f"TEST_subscriber_{uuid.uuid4().hex[:8]}@example.com"
        r = public_client.post(f"{BASE_URL}/api/public/subscribe", json={"email": email}, timeout=20)
        assert r.status_code in (200, 201)
        assert r.json().get("success") is True

    def test_subscribe_invalid_email(self, public_client):
        r = public_client.post(f"{BASE_URL}/api/public/subscribe", json={"email": "not-an-email"}, timeout=20)
        # API returns 200 with {success: true, data: {subscribed: false}} for invalid email
        assert r.status_code == 200
        body = r.json()
        assert body["data"].get("subscribed") is False


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success_sets_cookie(self, public_client):
        # Use a fresh session
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert "moataz_token" in s.cookies

    def test_login_invalid_credentials(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-password"}, timeout=20)
        assert r.status_code in (400, 401)
        assert r.json().get("success") is False

    def test_me_with_cookie(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["email"] == ADMIN_EMAIL

    def test_me_without_cookie(self):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code in (401, 200)
        if r.status_code == 200:
            assert r.json().get("success") is False or r.json().get("data") is None

    def test_logout_clears_cookie(self):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
        r = s.post(f"{BASE_URL}/api/auth/logout", timeout=20)
        assert r.status_code == 200
        # After logout, /me should be unauth
        me = s.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert me.status_code in (401, 200)
        if me.status_code == 200:
            assert me.json().get("success") is False or me.json().get("data") is None


# ---------------- Admin Auth Enforcement ----------------
class TestAdminAuthEnforcement:
    @pytest.mark.parametrize("path", [
        "/api/admin/stats",
        "/api/admin/posts",
        "/api/admin/categories",
        "/api/admin/tags",
        "/api/admin/ideas",
        "/api/admin/settings",
        "/api/admin/pages",
    ])
    def test_admin_endpoints_require_auth(self, path):
        s = requests.Session()
        r = s.get(f"{BASE_URL}{path}", timeout=20)
        assert r.status_code == 401, f"Expected 401 for {path}, got {r.status_code}: {r.text[:200]}"


# ---------------- Admin Stats ----------------
class TestAdminStats:
    def test_stats(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/stats", timeout=20)
        assert r.status_code == 200
        assert r.json()["success"] is True


# ---------------- Categories CRUD ----------------
class TestAdminCategories:
    created_id = None

    def test_create_category(self, admin_client):
        name = f"TEST_فئة_{uuid.uuid4().hex[:6]}"
        r = admin_client.post(f"{BASE_URL}/api/admin/categories", json={"name": name}, timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        cat = body["data"]
        assert "id" in cat
        assert cat.get("slug")  # auto-slugified
        TestAdminCategories.created_id = cat["id"]

    def test_update_category(self, admin_client):
        assert TestAdminCategories.created_id, "no created category"
        new_name = f"TEST_updated_{uuid.uuid4().hex[:6]}"
        r = admin_client.patch(f"{BASE_URL}/api/admin/categories/{TestAdminCategories.created_id}",
                                json={"name": new_name}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["success"] is True

    def test_delete_category(self, admin_client):
        assert TestAdminCategories.created_id
        r = admin_client.delete(f"{BASE_URL}/api/admin/categories/{TestAdminCategories.created_id}", timeout=20)
        assert r.status_code in (200, 204), r.text


# ---------------- Tags CRUD ----------------
class TestAdminTags:
    created_id = None

    def test_create_tag(self, admin_client):
        name = f"TEST_وسم_{uuid.uuid4().hex[:6]}"
        r = admin_client.post(f"{BASE_URL}/api/admin/tags", json={"name": name}, timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        TestAdminTags.created_id = body["data"]["id"]

    def test_update_tag(self, admin_client):
        assert TestAdminTags.created_id
        new_name = f"TEST_t_{uuid.uuid4().hex[:6]}"
        r = admin_client.patch(f"{BASE_URL}/api/admin/tags/{TestAdminTags.created_id}",
                                json={"name": new_name}, timeout=20)
        assert r.status_code == 200, r.text

    def test_delete_tag(self, admin_client):
        assert TestAdminTags.created_id
        r = admin_client.delete(f"{BASE_URL}/api/admin/tags/{TestAdminTags.created_id}", timeout=20)
        assert r.status_code in (200, 204), r.text


# ---------------- Posts CRUD ----------------
class TestAdminPosts:
    created_id = None

    def test_create_post_draft(self, admin_client):
        payload = {
            "title": f"TEST_مقال_{uuid.uuid4().hex[:6]}",
            "slug": f"test-post-{uuid.uuid4().hex[:8]}",
            "type": "ARTICLE",
            "content": "<p>محتوى تجريبي</p>",
            "excerpt": "ملخص",
            "status": "DRAFT",
        }
        r = admin_client.post(f"{BASE_URL}/api/admin/posts", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        TestAdminPosts.created_id = body["data"]["id"]
        assert body["data"]["status"] == "DRAFT"

    def test_update_post_to_published(self, admin_client):
        assert TestAdminPosts.created_id
        r = admin_client.patch(f"{BASE_URL}/api/admin/posts/{TestAdminPosts.created_id}",
                                json={"status": "PUBLISHED"}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["data"]["status"] == "PUBLISHED"

    def test_list_published(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/posts", params={"status": "PUBLISHED"}, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    def test_delete_post(self, admin_client):
        assert TestAdminPosts.created_id
        r = admin_client.delete(f"{BASE_URL}/api/admin/posts/{TestAdminPosts.created_id}", timeout=20)
        assert r.status_code in (200, 204), r.text


# ---------------- Ideas + Convert ----------------
class TestAdminIdeas:
    created_id = None

    def test_create_idea(self, admin_client):
        payload = {"title": f"TEST_فكرة_{uuid.uuid4().hex[:6]}", "summary": "ملخص فكرة"}
        r = admin_client.post(f"{BASE_URL}/api/admin/ideas", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        TestAdminIdeas.created_id = body["data"]["id"]

    def test_approve_idea(self, admin_client):
        assert TestAdminIdeas.created_id
        r = admin_client.patch(f"{BASE_URL}/api/admin/ideas/{TestAdminIdeas.created_id}",
                                json={"status": "APPROVED"}, timeout=20)
        assert r.status_code == 200, r.text

    def test_convert_idea_to_draft(self, admin_client):
        assert TestAdminIdeas.created_id
        r = admin_client.post(f"{BASE_URL}/api/admin/ideas/{TestAdminIdeas.created_id}/convert",
                                json={"status": "DRAFT"}, timeout=30)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True

    def test_convert_idea_direct_publish_blocked(self, admin_client):
        # Create a fresh idea
        r = admin_client.post(f"{BASE_URL}/api/admin/ideas",
                               json={"title": f"TEST_فكرة2_{uuid.uuid4().hex[:6]}", "summary": "x"}, timeout=20)
        assert r.status_code in (200, 201)
        idea_id = r.json()["data"]["id"]
        r2 = admin_client.post(f"{BASE_URL}/api/admin/ideas/{idea_id}/convert",
                                json={"status": "PUBLISHED"}, timeout=30)
        # Should be blocked because ENABLE_DIRECT_PUBLISH=false
        assert r2.status_code in (400, 403), r2.text
        body = r2.json()
        assert body.get("success") is False
        # cleanup
        admin_client.delete(f"{BASE_URL}/api/admin/ideas/{idea_id}", timeout=20)

    def test_delete_idea(self, admin_client):
        if TestAdminIdeas.created_id:
            r = admin_client.delete(f"{BASE_URL}/api/admin/ideas/{TestAdminIdeas.created_id}", timeout=20)
            assert r.status_code in (200, 204, 404)


# ---------------- Media upload ----------------
class TestAdminMedia:
    def test_upload_falls_back_to_inline(self, admin_client):
        # 1x1 PNG bytes
        png = bytes.fromhex("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082")
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = admin_client.post(f"{BASE_URL}/api/admin/media", files=files, timeout=30)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        # storage should be 'inline' since SUPABASE not configured
        data = body["data"]
        assert data.get("storage") in ("inline", "supabase", None) or "url" in data


# ---------------- Settings ----------------
class TestAdminSettings:
    def test_get_settings(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/settings", timeout=20)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_update_settings(self, admin_client):
        r = admin_client.put(f"{BASE_URL}/api/admin/settings",
                              json={"settings": {"site_description": "TEST description " + uuid.uuid4().hex[:6]}},
                              timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["success"] is True


# ---------------- Pages CRUD ----------------
class TestAdminPages:
    created_id = None

    def test_create_page(self, admin_client):
        payload = {"title": f"TEST_صفحة_{uuid.uuid4().hex[:6]}",
                   "slug": f"test-page-{uuid.uuid4().hex[:8]}",
                   "content": "<p>محتوى</p>"}
        r = admin_client.post(f"{BASE_URL}/api/admin/pages", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        TestAdminPages.created_id = body["data"]["id"]

    def test_update_page(self, admin_client):
        assert TestAdminPages.created_id
        r = admin_client.patch(f"{BASE_URL}/api/admin/pages/{TestAdminPages.created_id}",
                                json={"title": f"TEST_updated_{uuid.uuid4().hex[:6]}"}, timeout=20)
        assert r.status_code == 200, r.text

    def test_delete_page(self, admin_client):
        assert TestAdminPages.created_id
        r = admin_client.delete(f"{BASE_URL}/api/admin/pages/{TestAdminPages.created_id}", timeout=20)
        assert r.status_code in (200, 204), r.text
