# Author override and official domain patch

تمت إضافة حقول اختيارية للمقال:

- `guestAuthorName`
- `guestAuthorAvatar`
- `guestAuthorBio`

الاستخدام:

- من محرر المقالات ستجد قسم: **كاتب المقالة اختياري**.
- إذا ملأت هذه الحقول سيظهر الكاتب الضيف أسفل المقال وفي بطاقات المقال.
- إذا تُركت فارغة سيستخدم الموقع كاتب الحساب الأصلي.

الدومين الرسمي:

- الروابط و canonical و metadata تستخدم `NEXT_PUBLIC_SITE_URL`.
- اضبطه في Vercel على:

```env
NEXT_PUBLIC_SITE_URL=https://moatazalalqami.online
```

بعد رفع النسخة:

```bash
cd frontend
npx prisma generate
npx prisma db push
npm run build
```

لم يتم تغيير routing أو admin route groups لتجنب مشاكل Vercel.
