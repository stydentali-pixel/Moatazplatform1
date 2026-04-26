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
            <li className="flex gap-3 pt-2">
              {s.twitter ? <a href={s.twitter} className="hover:text-gold-300" aria-label="twitter">𝕏</a> : null}
              {s.facebook ? <a href={s.facebook} className="hover:text-gold-300" aria-label="facebook">f</a> : null}
              {s.instagram ? <a href={s.instagram} className="hover:text-gold-300" aria-label="instagram">◎</a> : null}
              {s.youtube ? <a href={s.youtube} className="hover:text-gold-300" aria-label="youtube">▶</a> : null}
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
