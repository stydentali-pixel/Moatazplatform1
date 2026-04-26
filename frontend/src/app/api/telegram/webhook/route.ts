import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { uniquePostSlug, readingTimeMinutes } from "@/lib/slug";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type TgMessage = {
  message_id?: number;
  chat?: { id?: number | string };
  text?: string;
  caption?: string;
  photo?: { file_id: string; file_size?: number; width?: number; height?: number }[];
  from?: { id?: number | string };
};

type TgUpdate = {
  message?: TgMessage;
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number | string };
    message?: TgMessage;
  };
};

type PublishSession = {
  mode: "publish_full";
  step: "title" | "content" | "image" | "category" | "confirm";
  title?: string;
  content?: string;
  coverImage?: string | null;
  categoryId?: string | null;
};

function configured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online").replace(/\/$/, "");
}

function cleanText(input = "") {
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
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function autoExcerpt(content: string) {
  const text = stripHtml(content);
  if (!text) return "مقال جديد من منصة معتز.";
  const target = Math.floor(text.length * 0.35);
  const start = Math.max(0, text.lastIndexOf(" ", target - 40));
  const excerpt = text.slice(start, start + 180).trim();
  return excerpt.length > 170 ? `${excerpt.slice(0, 170).trim()}…` : excerpt;
}

async function tg(method: string, body: Record<string, any>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((error) => {
    console.error(`Telegram ${method} error`, error);
    return null;
  });
}

async function sendMessage(chatId: string | number, text: string, extra: Record<string, any> = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false,
    ...extra,
  });
}

async function sendPhoto(chatId: string | number, photo: string, caption: string) {
  return tg("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
  });
}

async function answerCallback(callbackId?: string, text?: string) {
  if (!callbackId) return;
  return tg("answerCallbackQuery", { callback_query_id: callbackId, text: text || "" });
}

async function log(action: string, status: string, payload?: unknown, message?: string) {
  await prisma.automationLog
    .create({
      data: {
        action,
        status,
        entity: "telegram",
        payload: payload ? JSON.stringify(payload).slice(0, 8000) : null,
        message: message || null,
      },
    })
    .catch(() => null);
}

async function getSession(chatId: string | number): Promise<PublishSession | null> {
  const row = await prisma.setting.findUnique({
    where: { key: `telegram_session_${chatId}` },
  });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as PublishSession;
  } catch {
    return null;
  }
}

async function setSession(chatId: string | number, session: PublishSession) {
  await prisma.setting.upsert({
    where: { key: `telegram_session_${chatId}` },
    update: { value: JSON.stringify(session) },
    create: { key: `telegram_session_${chatId}`, value: JSON.stringify(session) },
  });
}

async function clearSession(chatId: string | number) {
  await prisma.setting.delete({ where: { key: `telegram_session_${chatId}` } }).catch(() => null);
}

async function uploadTelegramPhoto(fileId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

  const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoRes.json();

  const filePath = fileInfo?.result?.file_path;
  if (!filePath) throw new Error("Telegram file_path missing");

  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const ext = filePath.split(".").pop() || "jpg";
  const uploaded = await uploadFile(buffer, `telegram-cover.${ext}`, "image/jpeg");

  return uploaded.url;
}

async function chooseCategoryMessage(chatId: string | number, session: PublishSession) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  if (!categories.length) {
    session.categoryId = null;
    session.step = "confirm";
    await setSession(chatId, session);
    return sendConfirm(chatId, session);
  }

  const list = categories.map((c, i) => `${i + 1}. ${c.name}`).join("\n");

  await sendMessage(
    chatId,
    `اختر التصنيف بإرسال الرقم فقط:\n\n${list}\n\nأو اكتب /skip بدون تصنيف.`
  );
}

async function sendConfirm(chatId: string | number, session: PublishSession) {
  const category = session.categoryId
    ? await prisma.category.findUnique({ where: { id: session.categoryId }, select: { name: true } })
    : null;

  const preview =
    `راجع بيانات المقال:\n\n` +
    `العنوان: <b>${escapeHtml(session.title || "")}</b>\n` +
    `التصنيف: ${category?.name || "غير مصنف"}\n` +
    `الصورة: ${session.coverImage ? "موجودة" : "لا توجد"}\n\n` +
    `هل تريد نشر المقال الآن؟`;

  await sendMessage(chatId, preview, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "نعم، انشر ✅", callback_data: "confirm_publish_full" },
          { text: "إلغاء ❌", callback_data: "cancel_publish_full" },
        ],
      ],
    },
  });
}

async function publishFullArticle(chatId: string | number, session: PublishSession) {
  if (!session.title || !session.content) {
    await sendMessage(chatId, "بيانات المقال ناقصة. ابدأ من جديد عبر /publish_full");
    await clearSession(chatId);
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admin) {
    await sendMessage(chatId, "لا يوجد حساب مدير في قاعدة البيانات.");
    return;
  }

  const html = textToHtml(session.content);
  const slug = await uniquePostSlug(session.title);
  const excerpt = autoExcerpt(session.content);
  const publicUrl = `${siteUrl()}/posts/${slug}`;

  const post = await prisma.post.create({
    data: {
      title: session.title,
      slug,
      excerpt,
      content: html,
      coverImage: session.coverImage || null,
      status: "PUBLISHED",
      publishedAt: new Date(),
      readingTime: readingTimeMinutes(session.content),
      seoTitle: session.title,
      seoDescription: excerpt,
      canonicalUrl: publicUrl,
      authorId: admin.id,
      categoryId: session.categoryId || null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
    },
  });

  await log("publish_full", "success", { postId: post.id, slug: post.slug });

  const editUrl = `${siteUrl()}/admin/posts/${post.id}`;

  await sendMessage(
    chatId,
    `تم نشر المقال بنجاح ✅\n\n` +
      `<b>${escapeHtml(post.title)}</b>\n\n` +
      `رابط المقال:\n${publicUrl}\n\n` +
      `رابط التعديل:\n${editUrl}`
  );

  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (channelId) {
    const caption = `<b>${escapeHtml(post.title)}</b>\n\n${escapeHtml(post.excerpt || "")}\n\n${publicUrl}`;
    if (post.coverImage) {
      await sendPhoto(channelId, post.coverImage, caption);
    } else {
      await sendMessage(channelId, caption);
    }
  }

  await clearSession(chatId);
}

async function handlePublishFullFlow(chatId: string | number, text: string, msg?: TgMessage) {
  const session = await getSession(chatId);
  if (!session || session.mode !== "publish_full") return false;

  if (text === "/cancel") {
    await clearSession(chatId);
    await sendMessage(chatId, "تم إلغاء عملية النشر.");
    return true;
  }

  if (session.step === "title") {
    session.title = cleanText(text);
    session.step = "content";
    await setSession(chatId, session);
    await sendMessage(chatId, "أرسل نص المقال كاملًا الآن. يمكنك لصق المقال متعدد الأسطر.");
    return true;
  }

  if (session.step === "content") {
    session.content = text.trim();
    session.step = "image";
    await setSession(chatId, session);
    await sendMessage(chatId, "أرسل صورة الغلاف الآن، أو اكتب /skip لتجاوز الصورة.");
    return true;
  }

  if (session.step === "image") {
    if (msg?.photo?.length) {
      const photo = [...msg.photo].sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
      await sendMessage(chatId, "جاري رفع الصورة...");
      try {
        session.coverImage = await uploadTelegramPhoto(photo.file_id);
      } catch (error) {
        console.error("Telegram image upload error", error);
        session.coverImage = null;
        await sendMessage(chatId, "تعذر رفع الصورة. سيتم المتابعة بدون صورة.");
      }
    } else if (text !== "/skip") {
      await sendMessage(chatId, "أرسل صورة صحيحة أو اكتب /skip.");
      return true;
    }

    session.step = "category";
    await setSession(chatId, session);
    await chooseCategoryMessage(chatId, session);
    return true;
  }

  if (session.step === "category") {
    if (text === "/skip") {
      session.categoryId = null;
      session.step = "confirm";
      await setSession(chatId, session);
      await sendConfirm(chatId, session);
      return true;
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    const num = Number(text);
    const selected = Number.isInteger(num) ? categories[num - 1] : null;

    if (!selected) {
      await sendMessage(chatId, "رقم التصنيف غير صحيح. أرسل رقمًا من القائمة أو /skip.");
      return true;
    }

    session.categoryId = selected.id;
    session.step = "confirm";
    await setSession(chatId, session);
    await sendConfirm(chatId, session);
    return true;
  }

  return true;
}

export async function POST(req: NextRequest) {
  if (!configured()) return ok({ configured: false });

  const update = (await req.json().catch(() => ({}))) as TgUpdate;
  const msg = update.message || update.callback_query?.message;
  const text = (update.message?.text || update.message?.caption || update.callback_query?.data || "").trim();
  const chatId = msg?.chat?.id;
  const fromId = update.message?.from?.id || update.callback_query?.from?.id || chatId;

  if (!chatId) return ok({ ignored: true });

  if (String(fromId) !== String(process.env.TELEGRAM_ADMIN_ID)) {
    await sendMessage(chatId, "غير مسموح لك باستخدام هذا البوت.");
    await log("unauthorized", "rejected", { fromId, text });
    return ok({ rejected: true });
  }

  try {
    if (update.callback_query?.data === "cancel_publish_full") {
      await answerCallback(update.callback_query.id, "تم الإلغاء");
      await clearSession(chatId);
      await sendMessage(chatId, "تم إلغاء النشر.");
      return ok({ cancelled: true });
    }

    if (update.callback_query?.data === "confirm_publish_full") {
      await answerCallback(update.callback_query.id, "جاري النشر...");
      const session = await getSession(chatId);
      if (!session) {
        await sendMessage(chatId, "لا توجد عملية نشر نشطة.");
        return ok({ noSession: true });
      }
      await publishFullArticle(chatId, session);
      return ok({ published: true });
    }

    if (text === "/start" || text === "/help") {
      await sendMessage(
        chatId,
        `أهلاً بك في بوت إدارة منصة معتز 🚀\n\n` +
          `الأوامر:\n` +
          `/publish_full - نشر مقال كامل خطوة بخطوة\n` +
          `/draft عنوان المقال - إنشاء مسودة\n` +
          `/ideas - عرض الأفكار\n` +
          `/approve ideaId - اعتماد فكرة\n` +
          `/reject ideaId - رفض فكرة\n` +
          `/cancel - إلغاء العملية الحالية`
      );
      return ok({ help: true });
    }

    if (text === "/publish_full") {
      const session: PublishSession = { mode: "publish_full", step: "title" };
      await setSession(chatId, session);
      await sendMessage(chatId, "أرسل عنوان المقال الآن.");
      return ok({ started: true });
    }

    const handled = await handlePublishFullFlow(chatId, text, update.message);
    if (handled) return ok({ handled: true });

    if (text === "/ideas") {
      const ideas = await prisma.articleIdea.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true },
      });

      await sendMessage(
        chatId,
        ideas.length
          ? ideas.map((i) => `• ${i.id}\n${i.title} [${i.status}]`).join("\n\n")
          : "لا توجد أفكار حالياً."
      );
      return ok({ done: true });
    }

    if (text.startsWith("/draft ")) {
      const title = text.replace("/draft ", "").trim();
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });

      if (!admin) {
        await sendMessage(chatId, "لا يوجد مدير في قاعدة البيانات.");
        return ok({ noAdmin: true });
      }

      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          excerpt: "مسودة منشأة عبر تيليجرام.",
          content: "<p>هذه مسودة أولية تحتاج إلى تحرير يدوي.</p>",
          status: "DRAFT",
          readingTime: 1,
          authorId: admin.id,
        },
        select: { id: true, title: true, slug: true },
      });

      await log("draft", "success", post);

      await sendMessage(
        chatId,
        `تم إنشاء المسودة ✅\n\n` +
          `<b>${escapeHtml(post.title)}</b>\n\n` +
          `رابط التعديل:\n${siteUrl()}/admin/posts/${post.id}`
      );

      return ok({ post });
    }

    if (text.startsWith("/approve ")) {
      const id = text.replace("/approve ", "").trim();
      await prisma.articleIdea.update({ where: { id }, data: { status: "APPROVED" } });
      await log("approve", "success", { id });
      await sendMessage(chatId, `تم اعتماد الفكرة ✅\n${id}`);
      return ok({ id });
    }

    if (text.startsWith("/reject ")) {
      const id = text.replace("/reject ", "").trim();
      await prisma.articleIdea.update({ where: { id }, data: { status: "REJECTED" } });
      await log("reject", "success", { id });
      await sendMessage(chatId, `تم رفض الفكرة.\n${id}`);
      return ok({ id });
    }

    await sendMessage(chatId, "أمر غير معروف. اكتب /help لعرض الأوامر.");
    return ok({ unknown: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    await log("telegram_error", "error", { text }, error instanceof Error ? error.message : "Unknown error");
    await sendMessage(chatId, "حدث خطأ أثناء تنفيذ الأمر. حاول مرة أخرى.");
    return fail("Telegram command failed", 500);
  }
}

export async function GET() {
  return ok({
    configured: configured(),
    status: "telegram webhook ready",
    commands: ["/start", "/help", "/publish_full", "/draft", "/ideas", "/approve", "/reject"],
  });
}
