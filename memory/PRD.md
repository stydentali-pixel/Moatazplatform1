# PRD — Moataz Platform (معتز العلقمي)

## Original Problem Statement
Production-ready full-stack Arabic content platform: مقالات / قصص / روابط / صور / فيديوهات / اقتباسات. Real working app with FE + BE + DB + Auth + Admin Dashboard + Public API.

## User Choices (gathered Jan 2026)
- **Stack**: Next.js 14 + TypeScript + PostgreSQL + Prisma ✅
- **Auth**: Custom JWT — moataz775498320@gmail.com / Moataz7754@# ✅
- **AI**: DISABLED — placeholder content only ✅
- **Telegram Bot**: structure prepared, NOT activated ✅
- **Media storage**: Supabase Storage (with safe inline fallback) ✅

## Architecture
- Next.js (port 3000) full-stack — pages + API routes
- FastAPI proxy (port 8001) → forwards to Next.js (k8s ingress maps `/api/*` to 8001)
- PostgreSQL (port 5432) under supervisor
- Prisma ORM with `directUrl` for migrations
- bcryptjs + jsonwebtoken + httpOnly cookies (`moataz_token`)
- Tailwind + Cairo/Tajawal/Amiri Arabic fonts, RTL-first design

## Environment File Structure
| File | When loaded | Purpose |
| --- | --- | --- |
| `.env` | always | Defaults — local PostgreSQL for Emergent preview |
| `.env.production` | `next start` | Supabase URLs for Vercel production |
| `.env.local` | dev only, gitignored | Personal overrides on user's local laptop |
| `.env.local.example` | template | Copy to `.env.local` for local Supabase use |

## Database Models
User (ADMIN/EDITOR/AUTHOR), Post (DRAFT/PUBLISHED/SCHEDULED/ARCHIVED, types ARTICLE/STORY/LINK/IMAGE/VIDEO/QUOTE), Category, Tag, PostTag, Media, Page, Setting, ArticleIdea (SUGGESTED/DRAFTED/APPROVED/REJECTED/SCHEDULED/PUBLISHED), AutomationLog, Subscriber.

## Implemented (Apr 2026)
### Public Site
Home, Posts archive (filters + pagination), single post (rich content + tags + related + SEO), category page, tag page, tags index, categories index, search (with deep-link `?q=`), about, contact, sitemap.xml, robots.txt, newsletter subscribe.

### Admin Dashboard (Arabic, middleware-protected)
Login, dashboard stats + recent posts + quick actions, posts CRUD with rich-text editor (H2/H3/lists/quote/code/links/images), categories CRUD with auto-slug, tags CRUD with auto-slug, media library with Supabase + inline fallback, pages CRUD, article ideas (approve/reject/convert to draft / direct publish gated by ENABLE_DIRECT_PUBLISH), settings (site name/description/logo/colors/social links/email).

### APIs
**Public**: `/api/public/{posts,posts/[slug],categories,tags,search,settings,pages/[slug],subscribe}`
**Auth**: `/api/auth/{login,logout,me}`
**Admin**: `/api/admin/{stats,posts,posts/[id],categories,categories/[id],tags,tags/[id],media,media/[id],ideas,ideas/[id],ideas/[id]/convert,settings,pages,pages/[id]}`

### Integrations
- Supabase Storage (auto-fallback to inline when keys absent)
- Telegram bot scaffold (start gated by env)

### Seeded
1 admin (معتز العلقمي), 5 categories, 5 tags, 3 real posts, 3 article ideas, 9 site settings.

## Test Results
- Backend: 45/45 PASS (3 iterations)
- Frontend: full admin UI E2E pass (login → dashboard → posts CRUD → categories/tags/ideas/settings)
- Production build: `yarn build` succeeds

## Backlog / Next
- P1: Set real `NEXT_PUBLIC_SITE_URL` in `.env.production` before deploying
- P1: Use Supabase Pooler URL (`postgres.PROJECT_REF:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres`) if direct IPv6 unavailable
- P1: AI content generation (set `ENABLE_AI_CONTENT=true` + add Emergent LLM key)
- P1: Real `SUPABASE_SERVICE_ROLE_KEY` for cloud media
- P1: Telegram bot activation (add `TELEGRAM_BOT_TOKEN` + call `startBot()` from a startup hook)
- P2: Comment system (model exists, not exposed)
- P2: User management UI
- P2: Social share buttons on post pages
- P3: Tiptap upgrade for editor
- P3: External cron for auto-publishing SCHEDULED posts

## Known Limitations
- Direct Supabase DB hostname requires IPv6 (Emergent preview lacks it). Production platforms (Vercel/Railway) have IPv6 → works there. Pooler URL is the IPv4-friendly alternative.
- Editor uses contentEditable + execCommand (deprecated but functional).
- No automated scheduler — `SCHEDULED` posts need a cron.
