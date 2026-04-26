import Link from "next/link";
import { safeImageUrl, stripHtml } from "@/lib/content";

export type PostCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  type: string;
  publishedAt?: string | Date | null;
  readingTime?: number | null;
  category?: { name: string; slug: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "مقال",
  STORY: "قصة",
  LINK: "رابط",
  IMAGE: "صورة",
  VIDEO: "فيديو",
  QUOTE: "اقتباس",
};

function Cover({ src, title, feature = false }: { src?: string | null; title: string; feature?: boolean }) {
  const cover = safeImageUrl(src);
  return cover ? (
    <img
      src={cover}
      alt={title}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${feature ? "transition-transform duration-700 group-hover:scale-105" : ""}`}
    />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-cream-200 to-cream-100" />
  );
}

export default function PostCard({ post, variant = "default" }: { post: PostCardData; variant?: "default" | "feature" | "compact" }) {
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "";
  const excerpt = stripHtml(post.excerpt, 150);

  if (variant === "feature") {
    return (
      <Link href={`/posts/${post.slug}`} className="card group relative block" data-testid={`post-card-${post.slug}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-cream-100">
          <Cover src={post.coverImage} title={post.title} feature />
          <div className="absolute right-4 top-4 flex gap-2">
            <span className="rounded-full bg-ink-900 px-2 py-1 text-[11px] text-gold-300">{TYPE_LABELS[post.type] || post.type}</span>
            {post.category ? <span className="rounded-full bg-cream-50/95 px-2 py-1 text-[11px] text-ink-900 backdrop-blur">{post.category.name}</span> : null}
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="font-cairo text-xl font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-700 md:text-2xl">{post.title}</h3>
          {excerpt ? <p className="mt-3 line-clamp-2 text-sm leading-7 text-ink-600">{excerpt}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-500">
            {date ? <span>{date}</span> : null}
            {post.readingTime ? <span>· {post.readingTime} د قراءة</span> : null}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/posts/${post.slug}`} className="group flex gap-4" data-testid={`post-card-${post.slug}`}>
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-cream-100">
          <Cover src={post.coverImage} title={post.title} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[11px] text-gold-700">{TYPE_LABELS[post.type] || post.type}</div>
          <h3 className="line-clamp-2 font-cairo text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-700">{post.title}</h3>
          <div className="mt-2 text-xs text-ink-500">{date}</div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/posts/${post.slug}`} className="card group block" data-testid={`post-card-${post.slug}`}>
      <div className="relative aspect-[3/2] overflow-hidden bg-cream-100">
        <Cover src={post.coverImage} title={post.title} feature />
        <span className="absolute right-3 top-3 rounded-full bg-cream-50/95 px-2 py-1 text-[11px] text-ink-900 backdrop-blur">
          {TYPE_LABELS[post.type] || post.type}
        </span>
      </div>
      <div className="p-5">
        {post.category ? <div className="mb-2 text-[11px] text-gold-700">{post.category.name}</div> : null}
        <h3 className="line-clamp-2 font-cairo text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-700">{post.title}</h3>
        {excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-ink-600">{excerpt}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-500">
          {date ? <span>{date}</span> : null}
          {post.readingTime ? <span>· {post.readingTime} د قراءة</span> : null}
        </div>
      </div>
    </Link>
  );
}
