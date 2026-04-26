import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteHeader() {
  const s = await getSiteSettings();
  const siteName = s.siteName || "معتز العلقمي";
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-cream-50/85 border-b border-ink-900/5">
      <div className="container-px max-w-7xl mx-auto flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 group" data-testid="site-logo-link">
          <span className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-gold-400 font-amiri text-lg leading-none">م</span>
          </span>
          <div className="leading-tight">
            <div className="font-cairo font-bold text-ink-900 text-lg">{siteName}</div>
            <div className="text-[11px] text-ink-500 tracking-wide">منصّة المحتوى العربي</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[15px]">
          <Link href="/" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-home">الرئيسية</Link>
          <Link href="/posts" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-posts">المقالات</Link>
          <Link href="/categories" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-categories">التصنيفات</Link>
          <Link href="/tags" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-tags">الوسوم</Link>
          <Link href="/about" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-about">من نحن</Link>
          <Link href="/contact" className="text-ink-700 hover:text-gold-700 transition-colors" data-testid="nav-contact">اتصل بنا</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/10 hover:border-gold-700 hover:text-gold-700 transition-colors" data-testid="nav-search" aria-label="بحث">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </Link>
          <Link href="/admin/login" className="text-sm text-ink-700 hover:text-gold-700 px-3 py-2" data-testid="nav-login">تسجيل الدخول</Link>
        </div>
      </div>
    </header>
  );
}
