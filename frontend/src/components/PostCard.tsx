import Link from "next/link";

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

export default function PostCard({ post, variant = "default" }: { post: PostCardData; variant?: "default" | "feature" | "compact" }) {
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "";

  if (variant === "feature") {
    return (
      <Link href={`/posts/${post.slug}`} className="card group block relative" data-testid={`post-card-${post.slug}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-cream-100">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cream-200 to-cream-100" />
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="bg-ink-900 text-gold-300 text-[11px] px-2 py-1 rounded-full">{TYPE_LABELS[post.type] || post.type}</span>
            {post.category ? <span className="bg-cream-50/95 backdrop-blur text-ink-900 text-[11px] px-2 py-1 rounded-full">{post.category.name}</span> : null}
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-cairo font-bold text-xl md:text-2xl text-ink-900 leading-snug group-hover:text-gold-700 transition-colors">{post.title}</h3>
          {post.excerpt ? <p className="mt-3 text-ink-600 text-sm leading-7 line-clamp-2">{post.excerpt}</p> : null}
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
            {date ? <span>{date}</span> : null}
            {post.readingTime ? <span>· {post.readingTime} د قراءة</span> : null}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/posts/${post.slug}`} className="flex gap-4 group" data-testid={`post-card-${post.slug}`}>
        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-cream-100">
          {post.coverImage ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" /> : null}
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-gold-700 mb-1">{TYPE_LABELS[post.type] || post.type}</div>
          <h3 className="font-cairo font-bold text-base text-ink-900 leading-snug line-clamp-2 group-hover:text-gold-700 transition-colors">{post.title}</h3>
          <div className="mt-2 text-xs text-ink-500">{date}</div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/posts/${post.slug}`} className="card group block" data-testid={`post-card-${post.slug}`}>
      <div className="relative aspect-[3/2] overflow-hidden bg-cream-100">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream-200 to-cream-100" />
        )}
        <span className="absolute top-3 right-3 bg-cream-50/95 backdrop-blur text-ink-900 text-[11px] px-2 py-1 rounded-full">
          {TYPE_LABELS[post.type] || post.type}
        </span>
      </div>
      <div className="p-5">
        {post.category ? <div className="text-[11px] text-gold-700 mb-2">{post.category.name}</div> : null}
        <h3 className="font-cairo font-bold text-lg text-ink-900 leading-snug line-clamp-2 group-hover:text-gold-700 transition-colors">{post.title}</h3>
        {post.excerpt ? <p className="mt-2 text-ink-600 text-sm leading-7 line-clamp-2">{post.excerpt}</p> : null}
        <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
          {date ? <span>{date}</span> : null}
          {post.readingTime ? <span>· {post.readingTime} د قراءة</span> : null}
        </div>
      </div>
    </Link>
  );
}
