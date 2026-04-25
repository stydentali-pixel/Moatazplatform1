# PRD — Moataz Platform (معتز العلقمي)

## Original Problem Statement
Build a production-ready full-stack Arabic content platform "Moataz Platform | معتز العلقمي".
Luxury Arabic RTL blog/media for: مقالات / قصص / روابط / صور / فيديوهات / اقتباسات.
Real working app: Frontend + Backend + DB + Auth + Admin Dashboard + Public API.

## User Choices (gathered Jan 2026)
- **Stack**: Next.js 14 (App Router) + TypeScript + PostgreSQL + Prisma  ✅
- **Auth**: Custom JWT (email/password) — admin@site.com / 123456  ✅
- **AI**: DISABLED (`ENABLE_AI_CONTENT=false`) — placeholder content only  ✅
- **Telegram Bot**: structure prepared, NOT activated (safe fallback)  ✅
- **Media storage**: Supabase Storage with safe fallback when keys absent  ✅

## Architecture
- Next.js (full-stack) on port 3000 — pages + API routes
- FastAPI proxy on port 8001 → forwards to localhost:3000 (because k8s ingress routes `/api/*` to 8001)
- PostgreSQL on port 5432 (managed via supervisor)
- Prisma ORM
- bcryptjs + jsonwebtoken + httpOnly cookies (`moataz_token`)
- Tailwind + Cairo/Tajawal/Amiri Arabic fonts
- RTL-first design with deep gold + warm cream palette

## Database Models
User (ADMIN/EDITOR/AUTHOR), Post (DRAFT/PUBLISHED/SCHEDULED/ARCHIVED, types: ARTICLE/STORY/LINK/IMAGE/VIDEO/QUOTE), Category, Tag, PostTag, Media, Page, Setting, ArticleIdea (SUGGESTED/DRAFTED/APPROVED/REJECTED/SCHEDULED/PUBLISHED), AutomationLog, Subscriber.

## Implemented (Apr 25, 2026 / Jan 2026)
### Public Site
- Home with hero, featured, latest, categories grid, mixed sections, newsletter strip ✅
- Posts archive with filters (type, sort) + pagination ✅
- Single post with cover, content, tags, related, SEO metadata + OG/Twitter ✅
- Category page, Tag page, Tags index, Categories index ✅
- Search page (live) ✅
- About / Contact pages ✅
- Sitemap.xml, robots.txt ✅
- Newsletter subscription ✅

### Admin Dashboard (full Arabic, protected by middleware)
- Login (`/admin/login`) ✅
- Dashboard with stat cards + recent posts + quick actions ✅
- Posts: list (filter by status, search), create, edit (rich editor with H2/H3/lists/quote/code/links/images), delete, archive, schedule, feature toggle ✅
- Categories CRUD with auto slug ✅
- Tags CRUD with auto slug ✅
- Media library with upload (Supabase or fallback), copy URL, delete ✅
- Pages CRUD (static pages) ✅
- Article Ideas: create, approve/reject, convert to draft, direct publish (gated by ENABLE_DIRECT_PUBLISH) ✅
- Settings (site name, description, logo, colors, social links, email) ✅

### APIs (all under /api/)
- Auth: login, logout, me ✅
- Public: posts, posts/[slug], categories, tags, search, settings, pages/[slug], subscribe ✅
- Admin: stats, posts CRUD, categories CRUD, tags CRUD, media CRUD, ideas CRUD + convert, settings, pages CRUD ✅

### Integrations
- Supabase Storage (with safe fallback to inline data URL) ✅
- Telegram bot scaffold (start gated by ENV) ✅

### Seeded
- 1 admin (معتز العلقمي)
- 5 categories (مقالات/قصص/صور/فيديوهات/روابط)
- 5 tags (ثقافة/تقنية/مجتمع/رأي/إلهام)
- 3 real posts (writing-that-lasts, ai-and-arabic, one-cairo-night)
- 3 article ideas
- 9 site settings

## Backlog / Next
- P1: AI content generation (toggle ENABLE_AI_CONTENT=true with Emergent LLM key)
- P1: Real Supabase credentials for production media
- P1: Telegram bot activation with token + admin id
- P2: Comment system (model exists, not exposed)
- P2: User management UI (CRUD other users)
- P2: Multi-author bios
- P2: Social share buttons on posts
- P3: Markdown alongside HTML in editor
- P3: Image editor / cropper

## Known Limitations
- Editor uses execCommand (deprecated but works); upgrade to Tiptap/Slate later.
- Without Supabase keys, uploaded media is stored as data URL in DB (works but not scalable).
- No automated bot scheduler — `SCHEDULED` posts need manual cron or external scheduler.
