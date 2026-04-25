import Link from "next/link";
import { headers } from "next/headers";
import NewsletterForm from "./NewsletterForm";

async function getSettings(): Promise<Record<string, string>> {
  try {
    const h = headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "http";
    const res = await fetch(`${proto}://${host}/api/public/settings`, { cache: "no-store" });
    const json = await res.json();
    return json?.data || {};
  } catch {
    return {};
  }
}

export default async function SiteFooter() {
  const s = await getSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink-900 text-cream-100 relative overflow-hidden">
      <div className="container-px max-w-7xl mx-auto py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-full bg-gold-700 flex items-center justify-center">
              <span className="text-cream-50 font-amiri text-xl leading-none">م</span>
            </span>
            <div className="font-cairo font-bold text-xl">{s.siteName || "معتز العلقمي"}</div>
          </div>
          <p className="text-cream-100/70 text-sm leading-7">{s.siteDescription || "منصّة عربية فاخرة للمقالات والقصص والإلهام."}</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-gold-300">روابط</h4>
          <ul className="space-y-2 text-sm text-cream-100/80">
            <li><Link href="/posts" className="hover:text-gold-300">المقالات</Link></li>
            <li><Link href="/categories" className="hover:text-gold-300">التصنيفات</Link></li>
            <li><Link href="/tags" className="hover:text-gold-300">الوسوم</Link></li>
            <li><Link href="/about" className="hover:text-gold-300">من نحن</Link></li>
            <li><Link href="/contact" className="hover:text-gold-300">اتصل بنا</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-gold-300">تواصل</h4>
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
          <h4 className="font-bold mb-4 text-gold-300">النشرة البريدية</h4>
          <p className="text-sm text-cream-100/70 mb-3">اشترك لتصلك جواهر ما نُنتج كلّ أسبوع.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-cream-100/10">
        <div className="container-px max-w-7xl mx-auto py-5 text-center text-xs text-cream-100/50">
          © {year} {s.siteName || "معتز العلقمي"} — كل الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

// (newsletter form moved to client component)
