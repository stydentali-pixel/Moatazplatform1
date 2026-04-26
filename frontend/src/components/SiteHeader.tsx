import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULT_LOGO_URL, safeImageUrl } from "@/lib/content";

export default async function SiteHeader() {
  const s = await getSiteSettings();
  const siteName = s.siteName || "منصة معتز";
  const logo = safeImageUrl(s.logo) || DEFAULT_LOGO_URL;
  return (
    <header className="sticky top-0 z-30 border-b border-ink-900/5 bg-cream-50/90 backdrop-blur-md">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3" data-testid="site-logo-link">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gold-700/20 transition-transform group-hover:scale-105">
            <img src={logo} alt={siteName} className="h-full w-full object-cover" loading="eager" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-cairo text-base font-extrabold text-ink-900 sm:text-lg">{siteName}</div>
            <div className="hidden text-[11px] tracking-wide text-ink-500 sm:block">منصّة المعرفة والإلهام</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] md:flex">
          <Link href="/" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-home">الرئيسية</Link>
          <Link href="/posts" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-posts">المقالات</Link>
          <Link href="/categories" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-categories">التصنيفات</Link>
          <Link href="/tags" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-tags">الوسوم</Link>
          <Link href="/about" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-about">من نحن</Link>
          <Link href="/contact" className="text-ink-700 transition-colors hover:text-gold-700" data-testid="nav-contact">اتصل بنا</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/search" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/10 transition-colors hover:border-gold-700 hover:text-gold-700" data-testid="nav-search" aria-label="بحث">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </Link>
          <Link href="/admin/login" className="hidden px-3 py-2 text-sm text-ink-700 hover:text-gold-700 sm:block" data-testid="nav-login">دخول</Link>
        </div>
      </div>
    </header>
  );
}
