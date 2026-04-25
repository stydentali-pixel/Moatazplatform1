# معتز العلقمي — منصّة المحتوى العربي

منصّة عربية فاخرة (RTL) لنشر المقالات والقصص والمحتوى المتعدّد، مبنيّة بأحدث تقنيات الويب الإنتاجية.

## التقنيات

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + خطوط Cairo / Tajawal / Amiri
- **PostgreSQL** + **Prisma ORM**
- **JWT** للمصادقة (bcrypt + httpOnly cookies)
- **Supabase Storage** (مع fallback آمن لو لم تُضبط المفاتيح)
- **Telegram Bot** (هيكل جاهز، لا يُشغّل بدون TOKEN)

## التشغيل المحلي

### 1. متطلّبات
- Node.js ≥ 20
- PostgreSQL ≥ 14
- Yarn

### 2. تثبيت

```bash
cd /app/frontend
yarn install
```

### 3. متغيّرات البيئة

أنشئ ملف `.env` في `/app/frontend` بالقيم التالية:

```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB?schema=public"
JWT_SECRET="<random-64-hex>"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
ADMIN_EMAIL="admin@site.com"
ADMIN_PASSWORD="123456"

# اختياري
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ADMIN_ID=""
ENABLE_AI_CONTENT="false"
ENABLE_DIRECT_PUBLISH="false"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="media"
```

### 4. قاعدة البيانات

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. التشغيل

```bash
yarn dev   # تطوير
yarn build && yarn prod   # إنتاج
```

## الدخول للوحة الإدارة

- العنوان: `/admin/login`
- البريد: `admin@site.com`
- كلمة المرور: `123456`

> **مهم**: غيّر كلمة المرور بعد أوّل دخول من قسم المستخدمين أو عبر تحديث `ADMIN_PASSWORD` ثم إعادة تشغيل seed.

## بنية المشروع

```
/app
├── backend/              # FastAPI proxy (port 8001) → Next.js (port 3000)
│   └── server.py
└── frontend/             # تطبيق Next.js كامل
    ├── prisma/
    │   ├── schema.prisma # نماذج قاعدة البيانات
    │   └── seed.ts       # بيانات أوّليّة
    └── src/
        ├── app/
        │   ├── (public)  # الصفحات العامّة
        │   ├── admin/    # لوحة التحكم
        │   └── api/      # نقاط النهاية
        ├── components/
        ├── lib/
        └── middleware.ts # حماية مسارات الإدارة
```

## نقاط النهاية العامّة

| المسار | الوصف |
| --- | --- |
| `GET /api/public/posts` | قائمة المنشورات (مع فلاتر type, category, tag, sort, page, q) |
| `GET /api/public/posts/[slug]` | تفاصيل منشور + المنشورات ذات الصلة |
| `GET /api/public/categories` | كل التصنيفات |
| `GET /api/public/tags` | كل الوسوم |
| `GET /api/public/search?q=...` | بحث |
| `GET /api/public/settings` | إعدادات الموقع |
| `GET /api/public/pages/[slug]` | صفحة ثابتة |
| `POST /api/public/subscribe` | اشتراك بالنشرة |

كل الاستجابات تتبع الصيغة:
```json
{ "success": true, "data": ... }
```

## نقاط نهاية الإدارة (تحتاج تسجيل دخول)

- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`
- `GET|POST /api/admin/posts`, `PATCH|DELETE /api/admin/posts/[id]`
- `GET|POST /api/admin/categories`, `PATCH|DELETE /api/admin/categories/[id]`
- `GET|POST /api/admin/tags`, `PATCH|DELETE /api/admin/tags/[id]`
- `GET|POST /api/admin/media`, `DELETE /api/admin/media/[id]`
- `GET|POST /api/admin/ideas`, `PATCH|DELETE /api/admin/ideas/[id]`, `POST /api/admin/ideas/[id]/convert`
- `GET|PUT /api/admin/settings`
- `GET|POST /api/admin/pages`, `PATCH|DELETE /api/admin/pages/[id]`
- `GET /api/admin/stats`

## النشر

المشروع جاهز للنشر على:
- **Vercel** (موصى به مع Next.js)
- **Railway / Render / Fly.io** مع PostgreSQL مُدار
- **VPS تقليدي** عبر `next build && next start`

اضبط متغيّرات البيئة في لوحة منصّة النشر، ثم شغّل:
```bash
npx prisma db push
npx tsx prisma/seed.ts   # مرة واحدة فقط
```

## نظام أفكار المقالات

- لا يَنشر شيئاً تلقائيّاً.
- الحالات: `SUGGESTED → APPROVED → DRAFTED → PUBLISHED` (يدويّاً) أو `REJECTED`.
- زرّ "إلى مسوّدة" يُنشئ Post بحالة DRAFT ويُحوّلك للمحرّر.
- النشر المباشر يتطلّب `ENABLE_DIRECT_PUBLISH=true` + تأكيد.

## بوت Telegram

الكود جاهز في `src/lib/telegram.ts`. لتفعيله:
1. أضف `TELEGRAM_BOT_TOKEN` و `TELEGRAM_ADMIN_ID` للـ `.env`.
2. استدعِ `startBot()` من نقطة بدء (مثلاً API route مخصّص).
3. الأوامر: `/ideas`, `/draft`, `/publish`, `/schedule`, `/approve`, `/reject`.

## الترخيص

جميع الحقوق محفوظة © {YEAR} معتز العلقمي.
