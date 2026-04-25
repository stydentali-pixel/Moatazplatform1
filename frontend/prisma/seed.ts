import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@site.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";

  // Admin user
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  let admin;
  if (!existing) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "معتز العلقمي",
        role: "ADMIN",
        bio: "مؤسس المنصة، كاتب ومحرر للمحتوى الثقافي والتقني.",
      },
    });
    console.log("✓ Created admin");
  } else {
    admin = await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash, role: "ADMIN" },
    });
    console.log("✓ Updated admin password");
  }

  // Categories
  const categoryData = [
    { name: "مقالات", slug: "articles", description: "مقالات تحليلية ورأي" },
    { name: "قصص", slug: "stories", description: "قصص قصيرة وحكايات" },
    { name: "صور", slug: "images", description: "ألبومات وصور مختارة" },
    { name: "فيديوهات", slug: "videos", description: "محتوى مرئي" },
    { name: "روابط", slug: "links", description: "روابط مختارة بعناية" },
  ];
  for (const c of categoryData) {
    await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: { name: c.name, description: c.description } });
  }
  const categories = await prisma.category.findMany();
  console.log(`✓ Categories: ${categories.length}`);

  // Tags
  const tagData = [
    { name: "ثقافة", slug: "culture" },
    { name: "تقنية", slug: "tech" },
    { name: "مجتمع", slug: "society" },
    { name: "رأي", slug: "opinion" },
    { name: "إلهام", slug: "inspiration" },
  ];
  for (const t of tagData) {
    await prisma.tag.upsert({ where: { slug: t.slug }, create: t, update: { name: t.name } });
  }
  const tags = await prisma.tag.findMany();
  console.log(`✓ Tags: ${tags.length}`);

  // Settings
  const settings: Array<{ key: string; value: string }> = [
    { key: "siteName", value: "معتز العلقمي" },
    { key: "siteDescription", value: "منصة عربية فاخرة للمقالات والقصص والإلهام" },
    { key: "logo", value: "" },
    { key: "primaryColor", value: "#a26b1c" },
    { key: "email", value: "hello@moataz.platform" },
    { key: "twitter", value: "https://twitter.com" },
    { key: "facebook", value: "https://facebook.com" },
    { key: "instagram", value: "https://instagram.com" },
    { key: "youtube", value: "https://youtube.com" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, create: s, update: { value: s.value } });
  }
  console.log(`✓ Settings`);

  // Posts (3 real posts)
  const articlesCat = categories.find((c) => c.slug === "articles")!;
  const storiesCat = categories.find((c) => c.slug === "stories")!;
  const videosCat = categories.find((c) => c.slug === "videos")!;
  const cultureTag = tags.find((t) => t.slug === "culture")!;
  const techTag = tags.find((t) => t.slug === "tech")!;
  const inspirationTag = tags.find((t) => t.slug === "inspiration")!;

  const posts: Array<{
    title: string; slug: string; type: any; categoryId: string; excerpt: string;
    content: string; coverImage: string; featured: boolean; tags: string[];
  }> = [
    {
      title: "في حضرة الكلمة: كيف تكتب نصاً يَعْلق في الذاكرة",
      slug: "writing-that-lasts",
      type: "ARTICLE",
      categoryId: articlesCat.id,
      excerpt:
        "ثلاث قواعد بسيطة تنقل كتابتك من الجيد إلى الذي لا يُنسى — تجارب من تسع سنوات في غرف التحرير.",
      content: `<h2>أن تكتب يعني أن تختار</h2>
<p>الكتابة الجيدة ليست في كثرة الكلمات، بل في دقتها. حين تجلس أمام صفحة فارغة، تذكّر أنّ كلّ كلمة تختارها هي كلمة تُهمل سواها. هذه الانتقائية القاسية هي ما يصنع الفرق بين نصٍ يُقرأ ونصٍ يُؤرَّخ.</p>
<h3>1. اِفتتح بضربة</h3>
<p>القارئ العربي اليوم يتنقّل بسرعة الضوء بين العناوين. لديك جملة واحدة لتأسره، أو تخسره إلى الأبد.</p>
<h3>2. اكتب بأذنك</h3>
<p>اقرأ ما كتبتَه بصوت عالٍ. ما يثقل في الأذن، يثقل في القلب. الجمل الطويلة المتعرّجة موت بطيء للنص.</p>
<h3>3. احذف ثم احذف</h3>
<p>أوّل مسودة مهمتها أن تكون موجودة. المسودة الثانية مهمتها أن تكون قصيرة. المسودة الثالثة مهمتها أن تكون صحيحة.</p>
<blockquote>"أعتذر عن طول الرسالة، لم يكن لديّ وقت لأكتب أقصر." — باسكال</blockquote>
<p>اكتب كأنّك تنحت. كلّ كلمة لا تُضيف، تُنقص.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80",
      featured: true,
      tags: [cultureTag.id, inspirationTag.id],
    },
    {
      title: "الذكاء الاصطناعي ولغة الضّاد: فرصة أم تهديد؟",
      slug: "ai-and-arabic",
      type: "ARTICLE",
      categoryId: articlesCat.id,
      excerpt:
        "بين الذعر والتفاؤل المُفرط، نظرة هادئة على مستقبل المحتوى العربي في عصر النماذج اللغوية الكبرى.",
      content: `<h2>اللغة التي تَتأمّل نفسها</h2>
<p>للمرّة الأولى منذ قرون، تجد العربية نفسها أمام مرآةٍ غير بشرية. النماذج اللغوية الكبرى تقرأ، تكتب، وتترجم — لكنّها لا تشعر. هذه المسافة بين الفهم والإحساس هي حصن الكاتب العربي القادم.</p>
<h3>أين تبرع الآلة</h3>
<ul>
<li>الترجمة بين اللغات</li>
<li>التلخيص السريع</li>
<li>توليد المسوّدات الأوّلية</li>
</ul>
<h3>أين يبقى الإنسان لا يُعوّض</h3>
<ul>
<li>الإحساس بالسياق الاجتماعي</li>
<li>اختيار اللحظة المناسبة للقول</li>
<li>الصدق العاطفي</li>
</ul>
<p>المعركة ليست بين الإنسان والآلة، بل بين كاتب يستخدم الآلة وكاتب لا يستخدمها. الأوّل سينجو.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80",
      featured: true,
      tags: [techTag.id, cultureTag.id],
    },
    {
      title: "ليلة في القاهرة لا تشبه الليالي",
      slug: "one-cairo-night",
      type: "STORY",
      categoryId: storiesCat.id,
      excerpt:
        "قصّة قصيرة عن لقاءٍ عابر في مقهى وسط البلد، وكيف يمكن لخمس دقائق أن تُعيد ترتيب عمرٍ كامل.",
      content: `<p>كانت الساعة تقترب من الحادية عشرة حين دخلت المقهى. الدخان يتصاعد من فناجين القهوة كأنّه يحاول الهروب من الحديث. جلستُ في الزاوية التي اعتدتُها، وفتحتُ الكتاب. لم أكن أنتظر أحداً، لكنّ المدينة لها عادةٌ في أن تُرسل لك من تحتاج، حين لا تطلب.</p>
<p>"تسمح؟" قالت، وأشارت إلى الكرسي المقابل. كانت كلّ الكراسي الأخرى فارغة. ابتسمتُ. أومأتُ.</p>
<p>قالت إنّها تكتب أطروحتها عن الخطّ العربي. قلتُ إنّي أكتب، لكنّي لا أعرف عمّا. ضحكنا. ثم سكتنا. ثم سكتنا أكثر. خمس دقائق فقط، ثم نهضت، وقالت "شكراً" دون أن أعرف على ماذا، ومضت.</p>
<p>منذ تلك الليلة، وأنا أعرف عمّا أكتب.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1600&q=80",
      featured: false,
      tags: [cultureTag.id, inspirationTag.id],
    },
  ];

  for (const p of posts) {
    const exists = await prisma.post.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        type: p.type,
        categoryId: p.categoryId,
        excerpt: p.excerpt,
        content: p.content,
        coverImage: p.coverImage,
        featured: p.featured,
        status: "PUBLISHED",
        publishedAt: new Date(),
        readingTime: Math.max(2, Math.ceil(p.content.length / 1200)),
        authorId: admin.id,
        seoTitle: p.title,
        seoDescription: p.excerpt,
        tags: { create: p.tags.map((tagId) => ({ tagId })) },
      },
    });
  }
  console.log("✓ Posts seeded");

  // Article ideas
  const ideas = [
    "كيف تبني عادة قراءة في زمن التشتّت",
    "ملاحظات على فنّ المقال العربي الحديث",
    "خمسة أفلام عربية تُعيد تعريف الواقع",
  ];
  for (const t of ideas) {
    const found = await prisma.articleIdea.findFirst({ where: { title: t } });
    if (!found) {
      await prisma.articleIdea.create({
        data: { title: t, status: "SUGGESTED", source: "seed", authorId: admin.id },
      });
    }
  }
  console.log("✓ Ideas seeded");
  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
