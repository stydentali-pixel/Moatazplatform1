# Production deployment notes

Use Vercel with `frontend` as the Root Directory.

Required database URL for Supabase pooler:

```env
DATABASE_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:Moataz420%40%23%24@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
DIRECT_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:Moataz420%40%23%24@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
```

After changing Vercel variables, always Redeploy.

Run once against Supabase:

```bash
cd frontend
npx prisma db push
npx tsx prisma/seed.ts
```

If media uploads must store real images, add `SUPABASE_SERVICE_ROLE_KEY` and create/public bucket `media`. Without it, uploads will use a lightweight placeholder to prevent oversized Vercel payloads.

For extra DB speed, run `sql/production_indexes.sql` once in Supabase SQL Editor.
