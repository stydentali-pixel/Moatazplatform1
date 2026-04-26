# Production fixes applied

This package keeps the existing project structure and visual identity, but hardens the weak points that appeared on Vercel/Supabase:

- Fixed mobile admin layout: the sidebar is now a desktop sidebar and a mobile drawer.
- Reduced admin dashboard database pressure by replacing many count queries with one aggregate raw SQL query plus a recent posts query.
- Removed the extra Prisma user lookup from every admin page render by trusting the signed JWT payload after login validation.
- Added safer dashboard fallbacks so database delays do not crash the whole admin home.
- Made admin post listing lighter by selecting only the fields needed for the table.
- Added safer create/update/delete post handlers with try/catch and clear Arabic error messages.
- Improved PostEditor layout on mobile.
- Added global mobile table overflow protection.
- Reduced home page database pressure and added a safe fallback if the DB is temporarily unavailable.

## Required Vercel settings

Use these values for both `DATABASE_URL` and `DIRECT_URL`, then redeploy:

```env
DATABASE_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:Moataz420%40%23%24@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
DIRECT_URL=postgresql://postgres.rjlylljdaftevhvkcjdf:Moataz420%40%23%24@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=60
```

After changing variables in Vercel, always use:

`Deployments -> latest deployment -> Redeploy`

Saving env vars alone is not enough.

## Recommended next optimization

After this version is stable, ask the developer to move the admin dashboard stats to `/api/admin/stats` client-side loading with skeletons, and add `revalidate` caching for public pages. Do that only after confirming this production fix works.
