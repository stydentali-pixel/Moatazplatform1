import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import {
  postCardSelect,
  sanitizePostCards,
  safeImageUrl,
  truncateHtml,
  initials,
  generateExcerpt,
  displayAuthor,
} from "@/lib/content";
import type { Metadata } from "next";

export const revalidate = 300;

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "مقال",
  STORY: "قصة",
  LINK: "رابط",
  IMAGE: "صورة",
  VIDEO: "فيديو",
  QUOTE: "اقتباس",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      slug: true,
      seoTitle: true,
      excerpt: true,
      seoDescription: true,
      coverImage: true,
      canonicalUrl: true,
      content: true,
    },
  });

  if (!post) return { title: "غير موجود" };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online";

  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription ||
    post.excerpt ||
    (post.content ? generateExcerpt(post.content, post.title) || undefined : undefined);

  const image = safeImageUrl(post.coverImage);
  const canonical =
    post.canonicalUrl || `${siteUrl.replace(/\/$/, "")}/posts/${post.slug}`;

  return {
    title: `${title} — منصة معتز`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  let post: any = null;
  let related: any[] = [];

  try {
    post = await prisma.post.findFirst({
      where: { slug: params.slug, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        coverImage: true,

        guestAuthorName: true,
        guestAuthorAvatar: true,
        guestAuthorBio: true,

        publishedAt: true,
        readingTime: true,
        type: true,
        categoryId: true,

        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },

        category: {
          select: {
            name: true,
            slug: true,
          },
        },

        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (post) {
      related = sanitizePostCards(
        await prisma.post.findMany({
          where: {
            status: "PUBLISHED",
            id: { not: post.id },
            categoryId: post.categoryId,
          },
          take: 3,
          orderBy: { publishedAt: "desc" },
          select: postCardSelect,
        })
      );

      prisma.post
        .update({
          where: { id: post.id },
          data: { views: { increment: 1 } },
        })
        .catch(() => null);
    }
  } catch (error) {
    console.error("Post page error", error);
  }

  if (!post) notFound();

  const author = displayAuthor(post);

  const shouldShowAuthorCard =
    Boolean(author.name) || Boolean(author.avatar) || Boolean(author.bio);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online";

  const postUrl = `${siteUrl.replace(/\/$/, "")}/posts/${post.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description:
      post.excerpt || generateExcerpt(post.content, post.title) || undefined,
    image: safeImageUrl(post.coverImage)
      ? [safeImageUrl(post.coverImage)]
      : undefined,
    datePublished: post.publishedAt || undefined,
    author: {
      "@type": "Person",
      name: author.name || "منصة معتز",
    },
    mainEntityOfPage: postUrl,
  };

  return (
    <>
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="container-px mx-auto max-w-3xl py-12">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm text-gold-700">
            <span>{TYPE_LABELS[post.type] || post.type}</span>

            {post.category ? (
              <>
                <span className="opacity-50">·</span>
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="hover:underline"
                >
                  {post.category.name}
                </Link>
              </>
            ) : null}
          </div>

          <h1
            className="font-cairo text-3xl font-extrabold leading-tight text-ink-900 md:text-5xl"
            data-testid="post-title"
          >
            {post.title}
          </h1>

          {post.excerpt || generateExcerpt(post.content, post.title) ? (
            <p className="mt-5 text-lg leading-9 text-ink-600">
              {post.excerpt || generateExcerpt(post.content, post.title)}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-500">
            {author.name ? <span>{author.name}</span> : null}

            {date ? (
              <>
                {author.name ? <span>·</span> : null}
                <span>{date}</span>
              </>
            ) : null}

            {post.readingTime ? (
              <>
                {author.name || date ? <span>·</span> : null}
                <span>{post.readingTime} د قراءة</span>
              </>
            ) : null}
          </div>
        </div>
      </article>

      {safeImageUrl(post.coverImage) ? (
        <div className="container-px mx-auto max-w-5xl">
          <img
            src={safeImageUrl(post.coverImage) || ""}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full rounded-3xl object-cover"
          />
        </div>
      ) : null}

      <article className="container-px mx-auto max-w-3xl py-12">
        <div
          className="prose-rtl"
          data-testid="post-content"
          dangerouslySetInnerHTML={{ __html: truncateHtml(post.content) }}
        />

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((pt: any) => (
              <Link
                key={pt.tag.id}
                href={`/tags/${pt.tag.slug}`}
                className="chip"
                data-testid={`post-tag-${pt.tag.slug}`}
              >
                #{pt.tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {shouldShowAuthorCard ? (
          <section className="mt-14 rounded-2xl border border-ink-900/5 bg-cream-100 p-6">
            <div className="flex items-start gap-4">
              {author.avatar || author.name ? (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-700 text-cream-50 ring-1 ring-gold-700/20">
                  {safeImageUrl(author.avatar) ? (
                    <img
                      src={safeImageUrl(author.avatar) || ""}
                      alt={author.name || "كاتب المقال"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : author.name ? (
                    <span className="font-amiri text-2xl">
                      {initials(author.name)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                {author.name ? (
                  <div className="font-cairo font-bold text-ink-900">
                    {author.name}
                  </div>
                ) : null}

                {author.bio ? (
                  <p className="mt-1 text-sm leading-7 text-ink-600">
                    {author.bio}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section className="container-px mx-auto max-w-7xl py-12">
          <h2 className="heading-sec mb-8">قراءات ذات صلة</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <PostCard
                key={p.id}
                post={{
                  ...p,
                  publishedAt: p.publishedAt as any,
                  category: p.category,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </>
  );
}
