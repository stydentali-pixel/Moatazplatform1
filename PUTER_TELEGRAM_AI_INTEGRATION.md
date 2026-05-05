# Puter.js AI Integration

تمت إضافة دمج Puter.js بطريقة لا تعتمد على مفاتيح OpenAI ولا تضيف مزود AI داخل السيرفر.

## الصفحات المضافة

- `/ai-assistant` مساعد عام للكتابة والبرمجة والتحليل.
- `/article-tools` أدوات المقالات: تلخيص، SEO، إعادة صياغة، وتجميع مقال.
- `/script-helper` مساعد السكربتات والبوتات وتخطيط المشاريع البرمجية.
- `/telegram-webapp` واجهة خفيفة مخصصة للفتح من بوت تليجرام كـ Web App.

## الملفات المضافة

- `frontend/src/components/ai/PuterAiClient.tsx`
- `frontend/src/app/ai-assistant/page.tsx`
- `frontend/src/app/article-tools/page.tsx`
- `frontend/src/app/script-helper/page.tsx`
- `frontend/src/app/telegram-webapp/page.tsx`

## الملفات المعدلة

- `frontend/src/components/SiteHeader.tsx`
- `frontend/src/components/SiteFooter.tsx`
- `frontend/src/app/api/telegram/webhook/route.ts`

## تليجرام

تمت إضافة الأمر:

```text
/ai
```

ويظهر زر يفتح:

```text
/telegram-webapp
```

مع روابط مباشرة لأدوات المقالات ومساعد السكربتات.

## ملاحظة مهمة

Puter.js يعمل من المتصفح، لذلك وضعناه في صفحات Frontend، ولم نضعه داخل Webhook السيرفر حتى يبقى المشروع متوافقًا مع Vercel ولا يحتاج API Key في الواجهة.

تأكد أن متغير `NEXT_PUBLIC_SITE_URL` مضبوط على رابط موقعك الحقيقي في Vercel حتى تعمل أزرار تليجرام بشكل صحيح.
