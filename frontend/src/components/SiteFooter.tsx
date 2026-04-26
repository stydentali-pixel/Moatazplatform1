import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULT_LOGO_URL, safeImageUrl } from "@/lib/content";

export default async function SiteFooter() {
  const s = await getSiteSettings();
  const year = new Date().getFullYear();
  const siteName = s.siteName || "منصة معتز";
  const logo = safeImageUrl(s.logo) || DEFAULT_LOGO_URL;
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink-900 text-cream-100">
      <div className="container-px mx-auto grid max-w-7xl gap-10 py-16 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gold-300/20">
              <img src={logo} alt={siteName} className="h-full w-full object-cover" loading="lazy" />
            </span>
            <div className="font-cairo text-xl font-bold">{siteName}</div>
          </div>
          <p className="text-sm leading-7 text-cream-100/70">{s.siteDescription || "منصّة عربية فاخرة للمقالات والقصص والإلهام."}</p>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-gold-300">روابط</h4>
          <ul className="space-y-2 text-sm text-cream-100/80">
            <li><Link href="/posts" className="hover:text-gold-300">المقالات</Link></li>
            <li><Link href="/categories" className="hover:text-gold-300">التصنيفات</Link></li>
            <li><Link href="/tags" className="hover:text-gold-300">الوسوم</Link></li>
            <li><Link href="/about" className="hover:text-gold-300">من نحن</Link></li>
            <li><Link href="/contact" className="hover:text-gold-300">اتصل بنا</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-gold-300">تواصل</h4>
          <ul className="space-y-2 text-sm text-cream-100/80">
            {s.email ? <li>{s.email}</li> : null}
            <li className="flex flex-wrap gap-3 pt-2">
              {s.twitter ? (
                <a href={s.twitter} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-100/10 transition-colors hover:bg-gold-700 hover:text-white" aria-label="Twitter">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              ) : null}
              {s.facebook ? (
                <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-100/10 transition-colors hover:bg-gold-700 hover:text-white" aria-label="Facebook">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              ) : null}
              {s.instagram ? (
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-100/10 transition-colors hover:bg-gold-700 hover:text-white" aria-label="Instagram">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              ) : null}
              {s.youtube ? (
                <a href={s.youtube} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-100/10 transition-colors hover:bg-gold-700 hover:text-white" aria-label="YouTube">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              ) : null}
              {s.telegram ? (
                <a href={s.telegram} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-100/10 transition-colors hover:bg-gold-700 hover:text-white" aria-label="Telegram">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0C5.346 0 0 5.346 0 11.944c0 6.598 5.346 11.944 11.944 11.944 6.598 0 11.944-5.346 11.944-11.944C23.888 5.346 18.542 0 11.944 0zm5.203 8.32c-.16.833-.855 4.85-1.2 6.668-.147.77-.42 1.027-.697 1.053-.597.056-1.05-.393-1.626-.77-.903-.588-1.412-.953-2.29-1.53-.88-.577-.31-.894.19-1.413.13-.135 2.4-2.197 2.444-2.383.006-.024.012-.113-.04-.16-.052-.047-.128-.031-.183-.018-.077.018-1.308.832-3.682 2.435-.348.24-.663.356-.945.35-.31-.006-.91-.175-1.353-.32-.544-.177-.977-.272-.94-.575.02-.158.238-.32.656-.486 2.57-1.118 4.283-1.856 5.14-2.212 2.45-1.013 2.957-1.188 3.29-1.194.072-.001.235.018.34.103.088.073.112.17.12.247.008.077.011.24.004.394z"/></svg>
                </a>
              ) : null}
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-gold-300">النشرة البريدية</h4>
          <p className="mb-3 text-sm text-cream-100/70">اشترك لتصلك جواهر ما نُنتج كلّ أسبوع.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-cream-100/10">
        <div className="container-px mx-auto max-w-7xl py-5 text-center text-xs text-cream-100/50">
          © {year} {siteName} — كل الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
