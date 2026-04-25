import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "من نحن — معتز العلقمي" };

export default async function AboutPage() {
  const page = await prisma.page.findFirst({ where: { slug: "about", published: true } });
  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-3xl mx-auto py-16">
        <div className="text-gold-700 text-sm tracking-widest mb-2">من نحن</div>
        <h1 className="font-cairo text-4xl md:text-5xl font-extrabold text-ink-900 mb-8" data-testid="about-title">
          {page?.title || "معتز العلقمي"}
        </h1>
        <div className="prose-rtl">
          {page?.content ? (
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          ) : (
            <>
              <p>نُكتب هنا للقارئ الذي يَعدّ كلماته كما يَعدّ خطواته. منصّة عربية فاخرة للمحتوى الراقي، تجمع بين عمق الفكرة وبهاء الكلمة.</p>
              <p>نُعنى بالنشر البطيء والمدروس: مقالٌ واحد عميق خيرٌ من عشرة عابرة. وكلّ ما تقرأه هنا مرّ بثلاث مراجعات قبل أن يصلك.</p>
              <h2>قِيَمُنا</h2>
              <ul>
                <li>الجودة قبل الكمّ</li>
                <li>الصدق قبل البريق</li>
                <li>القارئ قبل الخوارزمية</li>
              </ul>
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
