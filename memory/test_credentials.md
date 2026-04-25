# Test Credentials — Moataz Platform

## Admin
- **Email:** `admin@site.com`
- **Password:** `123456`
- **Role:** ADMIN
- **Login URL:** `/admin/login`
- **Dashboard URL:** `/admin`

## Database
- **PostgreSQL:** `postgresql://postgres:postgres@localhost:5432/moataz_db?schema=public`
- **Connection from app:** via `DATABASE_URL` env

## Auth Endpoints (cookie-based, httpOnly)
- `POST /api/auth/login`     — body: `{ email, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

## Admin Endpoints (require auth cookie)
- `GET  /api/admin/stats`
- `GET|POST /api/admin/posts`
- `GET|PATCH|DELETE /api/admin/posts/[id]`
- `GET|POST /api/admin/categories`
- `PATCH|DELETE /api/admin/categories/[id]`
- `GET|POST /api/admin/tags`
- `PATCH|DELETE /api/admin/tags/[id]`
- `GET|POST /api/admin/media`
- `DELETE /api/admin/media/[id]`
- `GET|POST /api/admin/ideas`
- `PATCH|DELETE /api/admin/ideas/[id]`
- `POST /api/admin/ideas/[id]/convert`  — body: `{ status: "DRAFT"|"PUBLISHED"|"SCHEDULED" }`
- `GET|PUT  /api/admin/settings`
- `GET|POST /api/admin/pages`
- `PATCH|DELETE /api/admin/pages/[id]`

## Public Endpoints (no auth)
- `GET /api/public/posts?type=&category=&tag=&sort=&q=&page=&limit=`
- `GET /api/public/posts/[slug]`
- `GET /api/public/categories`
- `GET /api/public/tags`
- `GET /api/public/search?q=`
- `GET /api/public/settings`
- `GET /api/public/pages/[slug]`
- `POST /api/public/subscribe` — body: `{ email }`

All responses follow:
```json
{ "success": true, "data": ... }
```

## Auth Cookie
- Name: `moataz_token`
- httpOnly, secure, sameSite=lax, 7-day expiry
