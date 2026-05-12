import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id?: number;
  text?: string;
  caption?: string;
  chat?: { id?: number | string };
  from?: { id?: number | string; username?: string; first_name?: string };
};

type TelegramCallbackQuery = {
  id?: string;
  data?: string;
  from?: { id?: number | string };
  message?: TelegramMessage;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type PublishSession = {
  mode: "publish_full";
  step:
    | "title"
    | "content"
    | "coverImage"
    | "category"
    | "guestAuthorName"
    | "guestAuthorAvatar"
    | "guestAuthorBio"
    | "confirm";
  title?: string;
  content?: string;
  coverImage?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  guestAuthorName?: string | null;
  guestAuthorAvatar?: string | null;
  guestAuthorBio?: string | null;
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online"
).replace(/\/$/, "");

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function isConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID);
}

function isAdmin(id?: string | number | null) {
  if (!id) return false;
  return String(id) === String(process.env.TELEGRAM_ADMIN_ID);
}

function clean(input = "") {
  return input.replace(/\s+/g, " ").trim();
}

function stripHtml(input = "") {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(input = "") {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function textToHtml(input: string) {
  return input
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function excerptFromContent(input: string) {
  const text = stripHtml(input);
  if (!text) return "مقال جديد من منصة معتز العلقمي.";

  const middle = Math.floor(text.length * 0.35);
  const start = Math.max(0, text.lastIndexOf(" ", middle - 40));
  const value = text.slice(start, start + 180).trim();

  return value.length > 170 ? `${value.slice(0, 170).trim()}…` : value;
}

function readingTime(input: string) {
  const words = stripHtml(input).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function slugifyArabic(input: string) {
  const map: Record<string, string> = {
    أ: "a",
    إ: "i",
    آ: "a",
    ا: "a",
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: "h",
    خ: "kh",
    د: "d",
    ذ: "th",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: "s",
    ض: "d",
    ط: "t",
    ظ: "z",
    ع: "a",
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    و: "w",
    ي: "y",
    ى: "a",
    ة: "h",
    ء: "",
    ئ: "y",
   ؤ: "w",
  };

  const normalized = input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `post-${Date.now()}`;
}

async function uniqueSlug(title: string) {
  const base = slugifyArabic(title);
  let slug = base;
  let i = 2;

  while (await prisma.post.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i}`;
    i += 1;
  }

  return slug;
}

async function telegram(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return res.json().catch(() => null);
  } catch (error) {
    console.error(`Telegram ${method} failed`, error);
    return null;
  }
}

async function sendMessage(
  chatId: string | number,
  text: string,
  extra: Record<string, unknown> = {}
) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false,
    ...extra,
  });
}

async function sendPhoto(chatId: string | number, photo: string, caption: string) {
  return telegram("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
  });
}

async function answerCallback(callbackId?: string, text = "") {
  if (!callbackId) return null;
  return telegram("answerCallbackQuery", {
    callback_query_id: callbackId,
    text,
  });
}

async function logAction(
  whoRequested: string | number,
  actionType: string,
  status: string,
  details?: unknown
) {
  try {
    await prisma.automationLog.create({
      data: {
        whoRequested: String(whoRequested),
        actionType,
        status,
        details: details ? JSON.stringify(details).slice(0, 8000) : null,
        approvedAt: status === "APPROVED" || status === "SUCCESS" ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("AutomationLog failed", error);
  }
}

async function saveSession(chatId: string | number, session: PublishSession) {
  await logAction(chatId, "TELEGRAM_SESSION", "ACTIVE", session);
}

async function clearSession(chatId: string | number) {
  await logAction(chatId, "TELEGRAM_SESSION", "CLEARED", { cleared: true });
}

async function getSession(chatId: string | number): Promise<PublishSession | null> {
  const row = await prisma.automationLog.findFirst({
    where: {
      whoRequested: String(chatId),
      actionType: "TELEGRAM_SESSION",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      status: true,
      details: true,
    },
  });

  if (!row || row.status === "CLEARED" || !row.details) return null;

  try {
    return JSON.parse(row.details) as PublishSession;
  } catch {
    return null;
  }
}

async function getAdminUser() {
  return prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });
}

async function sendHelp(chatId: string | number) {
  await sendMessage(
    chatId,
    `أهلاً بك في بوت إدارة منصة معتز العلقمي 🚀\n\n` +
      `الأوامر:\n\n` +
      `/publish_full - نشر مقال كامل خطوة بخطوة\n` +
      `/draft عنوان المقال - إنشاء مسودة\n` +
      `/schedule عنوان المقال | YYYY-MM-DD HH:mm - جدولة مقال\n` +
      `/ideas - عرض آخر الأفكار\n` +
      `/approve ideaId - اعتماد فكرة\n` +
      `/reject ideaId - رفض فكرة\n` +
      `/cancel - إلغاء العملية الحالية\n\n` +
      `النشر الكامل يدعم:\n` +
      `العنوان، المحتوى، صورة الغلاف، التصنيف، كاتب اختياري، صورة الكاتب، نبذة الكاتب.`
  );
}

async function showCategories(chatId: string | number, session: PublishSession) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  if (!categories.length) {
    session.categoryId = null;
    session.categoryName = null;
    session.step = "guestAuthorName";
    await saveSession(chatId, session);

    await sendMessage(
      chatId,
      `لا توجد تصنيفات مفعلة.\n\n` +
        `هل تريد إضافة كاتب مختلف للمقال؟\n` +
        `أرسل اسم الكاتب أو اكتب /skip.`
    );
    return;
  }

  const list = categories.map((c, i) => `${i + 1}. ${c.name}`).join("\n");

  await sendMessage(
    chatId,
    `اختر التصنيف بإرسال الرقم فقط:\n\n${list}\n\n` +
      `أو اكتب /skip إذا لم ترد اختيار تصنيف.`
  );
}

async function sendConfirm(chatId: string | number, session: PublishSession) {
  const msg =
    `راجع بيانات المقال:\n\n` +
    `العنوان: <b>${escapeHtml(session.title || "")}</b>\n` +
    `التصنيف: ${escapeHtml(session.categoryName || "غير مصنف")}\n` +
    `صورة الغلاف: ${session.coverImage ? "موجودة" : "غير موجودة"}\n` +
    `كاتب خاص: ${session.guestAuthorName ? escapeHtml(session.guestAuthorName) : "لا يوجد"}\n` +
    `صورة الكاتب: ${session.guestAuthorAvatar ? "موجودة" : "غير موجودة"}\n\n` +
    `هل تريد نشر المقال الآن؟`;

  await sendMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "نعم، انشر ✅", callback_data: "publish_full_confirm" },
          { text: "إلغاء ❌", callback_data: "publish_full_cancel" },
        ],
      ],
    },
  });
}

async function publishArticle(chatId: string | number, session: PublishSession) {
  if (!session.title || !session.content) {
    await sendMessage(chatId, "بيانات المقال ناقصة. ابدأ من جديد عبر /publish_full");
    await clearSession(chatId);
    return;
  }

  const admin = await getAdminUser();

  if (!admin) {
    await sendMessage(chatId, "لا يوجد حساب مدير في قاعدة البيانات.");
    return;
  }

  const html = textToHtml(session.content);
  const excerpt = excerptFromContent(session.content);
  const slug = await uniqueSlug(session.title);
  const publicUrl = `${SITE_URL}/posts/${slug}`;

  const post = await prisma.post.create({
    data: {
      title: session.title,
      slug,
      excerpt,
      content: html,
      coverImage: session.coverImage || null,
      status: "PUBLISHED",
      type: "ARTICLE",
      featured: false,
      publishedAt: new Date(),
      readingTime: readingTime(session.content),
      seoTitle: session.title,
      seoDescription: excerpt,
      canonicalUrl: publicUrl,
      authorId: admin.id,
      categoryId: session.categoryId || null,

      guestAuthorName: session.guestAuthorName || null,
      guestAuthorAvatar: session.guestAuthorAvatar || null,
      guestAuthorBio: session.guestAuthorBio || null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      guestAuthorName: true,
    },
  });

  await logAction(chatId, "publish_full_published", "SUCCESS", {
    postId: post.id,
    slug: post.slug,
    title: post.title,
    guestAuthorName: post.guestAuthorName,
  });

  const editUrl = `${SITE_URL}/admin/posts/${post.id}/edit`;

  await sendMessage(
    chatId,
    `تم نشر المقال بنجاح ✅\n\n` +
      `<b>${escapeHtml(post.title)}</b>\n\n` +
      `رابط المقال:\n${publicUrl}\n\n` +
      `رابط التعديل:\n${editUrl}`
  );

  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (channelId) {
    const authorLine = post.guestAuthorName
      ? `\nالكاتب: ${escapeHtml(post.guestAuthorName)}`
      : "";

    const caption =
      `<b>${escapeHtml(post.title)}</b>\n\n` +
      `${escapeHtml(post.excerpt || "")}` +
      `${authorLine}\n\n` +
      `${publicUrl}`;

    if (post.coverImage) {
      await sendPhoto(channelId, post.coverImage, caption);
    } else {
      await sendMessage(channelId, caption);
    }
  }

  await clearSession(chatId);
}

async function handlePublishFlow(
  chatId: string | number,
  text: string,
  update: TelegramUpdate
) {
  const session = await getSession(chatId);
  if (!session || session.mode !== "publish_full") return false;

  if (text === "/cancel") {
    await clearSession(chatId);
    await logAction(chatId, "publish_full_cancelled", "SUCCESS", {});
    await sendMessage(chatId, "تم إلغاء عملية النشر.");
    return true;
  }

  if (session.step === "title") {
    const title = clean(text);
    if (!title || title.startsWith("/")) {
      await sendMessage(chatId, "أرسل عنوانًا صحيحًا للمقال.");
      return true;
    }

    session.title = title;
    session.step = "content";
    await saveSession(chatId, session);
    await sendMessage(chatId, "أرسل نص المقال كاملًا الآن.");
    return true;
  }

  if (session.step === "content") {
    const content = text.trim();
    if (!content || content.length < 20) {
      await sendMessage(chatId, "المحتوى قصير جدًا. أرسل نص المقال كاملًا.");
      return true;
    }

    session.content = content;
    session.step = "coverImage";
    await saveSession(chatId, session);
    await sendMessage(
      chatId,
      `أرسل رابط صورة الغلاف أو اكتب /skip.\n\n` +
        `مهم: أرسل رابط صورة مباشر يبدأ بـ https://`
    );
    return true;
  }

  if (session.step === "coverImage") {
    if (text !== "/skip") {
      if (!/^https?:\/\/.+/i.test(text)) {
        await sendMessage(chatId, "رابط الصورة غير صحيح. أرسل رابط يبدأ بـ https:// أو اكتب /skip.");
        return true;
      }

      session.coverImage = text.trim();
    } else {
      session.coverImage = null;
    }

    session.step = "category";
    await saveSession(chatId, session);
    await showCategories(chatId, session);
    return true;
  }

  if (session.step === "category") {
    if (text === "/skip") {
      session.categoryId = null;
      session.categoryName = null;
      session.step = "guestAuthorName";
      await saveSession(chatId, session);

      await sendMessage(
        chatId,
        `هل تريد إضافة كاتب مختلف للمقال؟\n` +
          `أرسل اسم الكاتب أو اكتب /skip.`
      );
      return true;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    });

    const index = Number(text);
    const selected = Number.isInteger(index) ? categories[index - 1] : null;

    if (!selected) {
      await sendMessage(chatId, "رقم التصنيف غير صحيح. أرسل رقمًا من القائمة أو /skip.");
      return true;
    }

    session.categoryId = selected.id;
    session.categoryName = selected.name;
    session.step = "guestAuthorName";
    await saveSession(chatId, session);

    await sendMessage(
      chatId,
      `هل تريد إضافة كاتب مختلف للمقال؟\n` +
        `أرسل اسم الكاتب أو اكتب /skip.`
    );
    return true;
  }

  if (session.step === "guestAuthorName") {
    if (text === "/skip") {
      session.guestAuthorName = null;
      session.guestAuthorAvatar = null;
      session.guestAuthorBio = null;
      session.step = "confirm";
      await saveSession(chatId, session);
      await sendConfirm(chatId, session);
      return true;
    }

    const name = clean(text);
    if (!name || name.startsWith("/")) {
      await sendMessage(chatId, "أرسل اسم الكاتب أو اكتب /skip.");
      return true;
    }

    session.guestAuthorName = name;
    session.step = "guestAuthorAvatar";
    await saveSession(chatId, session);

    await sendMessage(
      chatId,
      `أرسل رابط صورة الكاتب أو اكتب /skip.\n\n` +
        `يفضل رابط صورة مربع يبدأ بـ https://`
    );
    return true;
  }

  if (session.step === "guestAuthorAvatar") {
    if (text !== "/skip") {
      if (!/^https?:\/\/.+/i.test(text)) {
        await sendMessage(chatId, "رابط الصورة غير صحيح. أرسل رابط يبدأ بـ https:// أو اكتب /skip.");
        return true;
      }

      session.guestAuthorAvatar = text.trim();
    } else {
      session.guestAuthorAvatar = null;
    }

    session.step = "guestAuthorBio";
    await saveSession(chatId, session);

    await sendMessage(
      chatId,
      `أرسل نبذة قصيرة عن الكاتب أو اكتب /skip.`
    );
    return true;
  }

  if (session.step === "guestAuthorBio") {
    if (text !== "/skip") {
      session.guestAuthorBio = text.trim().slice(0, 500);
    } else {
      session.guestAuthorBio = null;
    }

    session.step = "confirm";
    await saveSession(chatId, session);
    await sendConfirm(chatId, session);
    return true;
  }

  return false;
}

async function createDraft(chatId: string | number, title: string) {
  const admin = await getAdminUser();

  if (!admin) {
    await sendMessage(chatId, "لا يوجد حساب مدير في قاعدة البيانات.");
    return;
  }

  const slug = await uniqueSlug(title);
  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: "مسودة منشأة عبر بوت تيليجرام.",
      content: "<p>هذه مسودة أولية تحتاج إلى تحرير يدوي.</p>",
      status: "DRAFT",
      type: "ARTICLE",
      featured: false,
      readingTime: 1,
      authorId: admin.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  await logAction(chatId, "draft_created", "SUCCESS", post);

  await sendMessage(
    chatId,
    `تم إنشاء المسودة ✅\n\n` +
      `<b>${escapeHtml(post.title)}</b>\n\n` +
      `رابط التعديل:\n${SITE_URL}/admin/posts/${post.id}/edit`
  );
}

async function schedulePost(chatId: string | number, input: string) {
  const [titleRaw, dateRaw] = input.split("|").map((v) => v?.trim());

  if (!titleRaw || !dateRaw) {
    await sendMessage(
      chatId,
      `صيغة الجدولة غير صحيحة.\n\nمثال:\n/schedule مقال جديد | 2026-05-01 10:00`
    );
    return;
  }

  const date = new Date(dateRaw.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    await sendMessage(chatId, "تاريخ الجدولة غير صحيح. استخدم: YYYY-MM-DD HH:mm");
    return;
  }

  const admin = await getAdminUser();

  if (!admin) {
    await sendMessage(chatId, "لا يوجد حساب مدير في قاعدة البيانات.");
    return;
  }

  const slug = await uniqueSlug(titleRaw);

  const post = await prisma.post.create({
    data: {
      title: titleRaw,
      slug,
      excerpt: "مقال مجدول من بوت تيليجرام.",
      content: "<p>هذه مسودة مجدولة تحتاج إلى تحرير يدوي.</p>",
      status: "SCHEDULED",
      type: "ARTICLE",
      featured: false,
      scheduledAt: date,
      readingTime: 1,
      authorId: admin.id,
    },
    select: { id: true, title: true, scheduledAt: true },
  });

  await logAction(chatId, "post_scheduled", "SUCCESS", post);

  await sendMessage(
    chatId,
    `تمت جدولة المقال ✅\n\n` +
      `<b>${escapeHtml(post.title)}</b>\n` +
      `الموعد: ${post.scheduledAt?.toISOString()}\n\n` +
      `رابط التعديل:\n${SITE_URL}/admin/posts/${post.id}/edit`
  );
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return json({ success: true, configured: false });
  }

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;

  const message = update.message || update.callback_query?.message;
  const chatId = message?.chat?.id;
  const fromId = update.message?.from?.id || update.callback_query?.from?.id || chatId;
  const text = (
    update.message?.text ||
    update.message?.caption ||
    update.callback_query?.data ||
    ""
  ).trim();

  if (!chatId) {
    return json({ success: true, ignored: true });
  }

  if (!isAdmin(fromId)) {
    await sendMessage(chatId, "غير مسموح لك باستخدام هذا البوت.");
    await logAction(chatId, "telegram_unauthorized", "REJECTED", { fromId, text });
    return json({ success: true, rejected: true });
  }

  try {
    if (update.callback_query?.data === "publish_full_cancel") {
      await answerCallback(update.callback_query.id, "تم الإلغاء");
      await clearSession(chatId);
      await logAction(chatId, "publish_full_cancelled", "SUCCESS", {});
      await sendMessage(chatId, "تم إلغاء النشر.");
      return json({ success: true });
    }

    if (update.callback_query?.data === "publish_full_confirm") {
      await answerCallback(update.callback_query.id, "جاري النشر...");
      const session = await getSession(chatId);

      if (!session) {
        await sendMessage(chatId, "لا توجد عملية نشر نشطة.");
        return json({ success: true });
      }

      await publishArticle(chatId, session);
      return json({ success: true, published: true });
    }

    if (text === "/start" || text === "/help") {
      await sendHelp(chatId);
      return json({ success: true });
    }

    if (text === "/cancel") {
      await clearSession(chatId);
      await sendMessage(chatId, "تم إلغاء العملية الحالية.");
      return json({ success: true });
    }

    if (text === "/publish_full") {
      const session: PublishSession = {
        mode: "publish_full",
        step: "title",
      };

      await saveSession(chatId, session);
      await logAction(chatId, "publish_full_started", "SUCCESS", {});
      await sendMessage(chatId, "أرسل عنوان المقال الآن.");
      return json({ success: true, started: true });
    }

    const handled = await handlePublishFlow(chatId, text, update);
    if (handled) {
      return json({ success: true, handled: true });
    }

    if (text.startsWith("/draft ")) {
      const title = clean(text.replace("/draft ", ""));
      if (!title) {
        await sendMessage(chatId, "اكتب عنوان المسودة بعد الأمر.");
        return json({ success: true });
      }

      await createDraft(chatId, title);
      return json({ success: true });
    }

    if (text.startsWith("/publish ")) {
      const title = clean(text.replace("/publish ", ""));
      if (!title) {
        await sendMessage(chatId, "اكتب عنوان المقال بعد الأمر.");
        return json({ success: true });
      }

      await sendMessage(
        chatId,
        `للنشر الكامل استخدم:\n/publish_full\n\n` +
          `أو أنشئ مسودة بهذا العنوان:\n/draft ${escapeHtml(title)}`
      );

      return json({ success: true });
    }

    if (text.startsWith("/schedule ")) {
      await schedulePost(chatId, text.replace("/schedule ", "").trim());
      return json({ success: true });
    }

    if (text === "/ideas") {
      const ideas = await prisma.articleIdea.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          keyword: true,
        },
      });

      if (!ideas.length) {
        await sendMessage(chatId, "لا توجد أفكار حالياً.");
        return json({ success: true });
      }

      await sendMessage(
        chatId,
        ideas
          .map(
            (idea) =>
              `• <b>${escapeHtml(idea.title)}</b>\n` +
              `ID: ${idea.id}\n` +
              `الحالة: ${idea.status}\n` +
              `الكلمة: ${escapeHtml(idea.keyword || "-")}`
          )
          .join("\n\n")
      );

      return json({ success: true });
    }

    if (text.startsWith("/approve ")) {
      const id = clean(text.replace("/approve ", ""));
      await prisma.articleIdea.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      await logAction(chatId, "idea_approved", "SUCCESS", { id });
      await sendMessage(chatId, `تم اعتماد الفكرة ✅\n${id}`);
      return json({ success: true });
    }

    if (text.startsWith("/reject ")) {
      const id = clean(text.replace("/reject ", ""));
      await prisma.articleIdea.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      await logAction(chatId, "idea_rejected", "SUCCESS", { id });
      await sendMessage(chatId, `تم رفض الفكرة.\n${id}`);
      return json({ success: true });
    }

    await sendMessage(chatId, "أمر غير معروف. اكتب /help لعرض الأوامر.");
    return json({ success: true, unknown: true });
  } catch (error) {
    console.error("Telegram webhook error", error);

    await logAction(chatId, "telegram_error", "ERROR", {
      text,
      error: error instanceof Error ? error.message : String(error),
    });

    await sendMessage(chatId, "حدث خطأ أثناء تنفيذ الأمر. حاول مرة أخرى أو راجع السجلات.");
    return json({ success: false, error: "Telegram command failed" }, 500);
  }
}

export async function GET() {
  return json({
    success: true,
    configured: isConfigured(),
    status: "Telegram webhook ready",
    commands: [
      "/start",
      "/help",
      "/publish_full",
      "/draft",
      "/publish",
      "/schedule",
      "/ideas",
      "/approve",
      "/reject",
      "/cancel",
    ],
  });
}
