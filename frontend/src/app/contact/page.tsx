import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "اتصل بنا — معتز العلقمي" };

export default async function ContactPage() {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-3xl mx-auto py-16">
        <div className="text-gold-700 text-sm tracking-widest mb-2">اتصل بنا</div>
        <h1 className="font-cairo text-4xl md:text-5xl font-extrabold text-ink-900 mb-8">
          نُحبّ أن نسمع منك
        </h1>
        <p className="text-ink-600 leading-9 mb-8">
          سواء كنت كاتباً تبحث عن منصّة، أو قارئاً يريد إخبارنا بشيء، أو ناشراً يبحث عن تعاون — نحن هنا.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="text-gold-700 text-xs tracking-widest mb-2">البريد</div>
            <div className="font-cairo text-lg font-bold text-ink-900">{map.email || "hello@moataz.platform"}</div>
          </div>
          <div className="card p-6">
            <div className="text-gold-700 text-xs tracking-widest mb-2">السوشيال</div>
            <div className="flex gap-3 text-2xl">
              {map.twitter ? <a href={map.twitter} className="hover:text-gold-700 text-ink-700" aria-label="twitter">𝕏</a> : null}
              {map.instagram ? <a href={map.instagram} className="hover:text-gold-700 text-ink-700" aria-label="instagram">◎</a> : null}
              {map.youtube ? <a href={map.youtube} className="hover:text-gold-700 text-ink-700" aria-label="youtube">▶</a> : null}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
