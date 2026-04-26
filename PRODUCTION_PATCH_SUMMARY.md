# Moataz Platform — Production Patch Summary

هذه النسخة عولجت لتثبيت الموقع وواجهات الـ API قبل الانتقال إلى تطبيق Android.

## أهم التعديلات
- اعتماد الشعار الرسمي داخل `frontend/public/brand/logo.jpg` و `frontend/public/brand/icon-192.jpg`.
- عرض الشعار في الموقع، الفوتر، صفحة الدخول، ولوحة التحكم.
- تخفيف الصفحة الرئيسية ومنع جلب `content` للمقالات في البطاقات لمنع `FALLBACK_BODY_TOO_LARGE`.
- دعم توليد المقتطف تلقائيًا إذا تُرك الحقل فارغًا عند إنشاء/تحديث المقال.
- منع حفظ صور Base64 في البطاقات، واعتماد روابط صور فقط.
- تحسين بطاقات المقالات بعرض صورة الكاتب الدائرية أو الأحرف الأولى عند عدم وجود صورة.
- إضافة حقل صورة الكاتب/الأدمن في إعدادات لوحة التحكم.
- إلزام اختيار التصنيف قبل نشر المقال.
- تحسين JSON-LD للمقالات وبيانات Open Graph الأساسية.
- تحسين فهارس SQL في `sql/production_indexes.sql`.

## تذكير إعدادات Vercel
استخدم Pooler URL بهذا النمط:

```env
DATABASE_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:YOUR_ENCODED_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
DIRECT_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:YOUR_ENCODED_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
SUPABASE_STORAGE_BUCKET=media
SUPABASE_SERVICE_ROLE_KEY=ضعه من Supabase عند تفعيل رفع الصور
```

بعد الرفع:

```bash
cd frontend
npx prisma db push
npx tsx prisma/seed.ts
```

ثم اعمل Redeploy في Vercel.
