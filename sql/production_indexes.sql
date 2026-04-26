-- Optional production indexes for Supabase/PostgreSQL.
-- Run once in Supabase SQL Editor if Prisma db push did not create them.
CREATE INDEX IF NOT EXISTS idx_post_status_published_at ON public."Post" (status, "publishedAt");
CREATE INDEX IF NOT EXISTS idx_post_type ON public."Post" (type);
CREATE INDEX IF NOT EXISTS idx_post_featured ON public."Post" (featured);
CREATE INDEX IF NOT EXISTS idx_post_category_id ON public."Post" ("categoryId");
CREATE INDEX IF NOT EXISTS idx_post_created_at ON public."Post" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_post_tag_post_id ON public."PostTag" ("postId");
CREATE INDEX IF NOT EXISTS idx_post_tag_tag_id ON public."PostTag" ("tagId");
CREATE INDEX IF NOT EXISTS idx_post_status_category_published ON public."Post" (status, "categoryId", "publishedAt");
CREATE INDEX IF NOT EXISTS idx_post_status_type_published ON public."Post" (status, type, "publishedAt");
CREATE INDEX IF NOT EXISTS idx_category_slug ON public."Category" (slug);
CREATE INDEX IF NOT EXISTS idx_tag_slug ON public."Tag" (slug);
