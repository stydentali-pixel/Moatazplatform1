import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { uniquePostSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online";

type TelegramUpdate = {
  message?: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data: string;
  };
};

async function sendMessage(chatId: number, text: string, options: any = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...options }),
  }).catch((error) => console.error("Telegram sendMessage error", error));
}

async function editMessageText(chatId: number, messageId: number, text: string, options: any = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", ...options }),
  }).catch((error) => console.error("Telegram editMessageText error", error));
}

async function logAction(whoId: number, action: string, status: string, details?: any) {
  await prisma.automationLog.create({
    data: {
      action,
      status,
      entity: "telegram",
      payload: details ? JSON.stringify(details).slice(0, 8000) : null,
      message: `User ${whoId} performed ${action}`,
    },
  }).catch(() => null);
}

async function sendToChannel(post: any) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!channelId || !token) return;

  const text = `<b>${post.title}</b>\n\n${post.excerpt || ""}\n\n<a href="${SITE_URL}/posts/${post.slug}">اقرأ المزيد</a>`;
  
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: channelId, text, parse_mode: "HTML" }),
  }).catch((error) => console.error("Telegram channel sendMessage error", error));
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_ID;

  if (!token || !adminId) return ok({ configured: false });

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
  const fromId = update.message?.from?.id || update.callback_query?.from?.id;
  const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;

  if (!chatId || !fromId) return ok({ ignored: true });

  if (String(fromId) !== String(adminId)) {
    await sendMessage(chatId, "عذراً، هذا البوت مخصص للمسؤول فقط. لا تملك صلاحية الوصول.");
    await logAction(fromId, "unauthorized_access", "rejected", { fromId });
    return ok({ rejected: true });
  }

  const helpMessage = `
<b>أهلاً بك في بوت إدارة منصة معتز القمي 🚀</b>

يمكنك استخدام الأوامر التالية لإدارة المحتوى:

• <code>/ideas</code> - عرض آخر 10 أفكار مقترحة.
• <code>/draft [العنوان]</code> - إنشاء مسودة مقال جديدة.
• <code>/publish [العنوان]</code> - نشر مقال مباشرة.
• <code>/schedule [العنوان] | YYYY-MM-DD HH:mm</code> - جدولة نشر مقال.
• <code>/approve [ideaId]</code> - اعتماد فكرة وتحويلها لمسودة.
• <code>/reject [ideaId]</code> - رفض فكرة مقترحة.

<b>أمثلة:</b>
<code>/draft أهمية الذكاء الاصطناعي</code>
<code>/schedule مقال جديد | 2024-05-01 10:00</code>
  `;

  try {
    // Handle Callback Queries (Confirmation buttons)
    if (update.callback_query) {
      const { data, message } = update.callback_query;
      if (!message) return ok({ done: true });

      if (data.startsWith("pub_confirm:")) {
        const title = data.split(":")[1];
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        const slug = await uniquePostSlug(title);
        const post = await prisma.post.create({
          data: {
            title,
            slug,
            content: "<p>تم النشر عبر التليجرام.</p>",
            status: "PUBLISHED",
            publishedAt: new Date(),
            authorId: admin?.id || "default",
          }
        });

        await logAction(fromId, "publish_post", "success", { title, postId: post.id });
        const reply = `🚀 تم النشر بنجاح!
<b>العنوان:</b> ${title}
🔗 <a href="${SITE_URL}/posts/${post.slug}">رابط المقال العام</a>
🛠 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل من لوحة التحكم</a>`;
        
        await editMessageText(chatId, message.message_id, reply);
        await sendToChannel(post);
        return ok({ published: true });
      }

      if (data === "pub_cancel") {
        await editMessageText(chatId, message.message_id, "تم إلغاء عملية النشر.");
        return ok({ cancelled: true });
      }
    }

    // Handle Messages
    const text = update.message?.text?.trim() || "";
    if (!text) return ok({ ignored: true });

    if (text === "/start" || text === "/help") {
      await sendMessage(chatId, helpMessage);
      return ok({ help: true });
    }

    if (text === "/ideas") {
      const ideas = await prisma.articleIdea.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
      const reply = ideas.length
        ? ideas.map((i) => `• <code>${i.id}</code> — ${i.title} [${i.status}]`).join("\n")
        : "لا توجد أفكار حالياً.";
      await sendMessage(chatId, reply);
      return ok({ ideas: true });
    }

    if (text.startsWith("/draft ")) {
      const title = text.replace("/draft ", "").trim();
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: "<p>مسودة أنشئت عبر التليجرام.</p>",
          status: "DRAFT",
          authorId: admin?.id || "default",
        }
      });
      await logAction(fromId, "create_draft", "success", { title, postId: post.id });
      const reply = `✅ تم إنشاء المسودة بنجاح!
<b>العنوان:</b> ${title}
<b>الحالة:</b> مسودة
🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المقال</a>`;
      await sendMessage(chatId, reply);
      return ok({ draft: true });
    }

    if (text.startsWith("/publish ")) {
      const title = text.replace("/publish ", "").trim();
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "نعم، انشر ✅", callback_data: `pub_confirm:${title}` },
              { text: "إلغاء ❌", callback_data: `pub_cancel` }
            ]
          ]
        }
      };
      await sendMessage(chatId, `هل تريد نشر هذا المقال الآن؟\n<b>العنوان:</b> ${title}`, opts);
      return ok({ pending_publish: true });
    }

    if (text.startsWith("/schedule ")) {
      const raw = text.replace("/schedule ", "").trim();
      const [title, dateStr] = raw.split("|").map((v) => v?.trim());
      if (!title || !dateStr) {
        await sendMessage(chatId, "❌ يرجى استخدام التنسيق الصحيح: /schedule العنوان | YYYY-MM-DD HH:mm");
        return ok({ error: "bad_format" });
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        await sendMessage(chatId, "❌ تنسيق التاريخ غير صحيح. يرجى استخدام: YYYY-MM-DD HH:mm");
        return ok({ error: "bad_date" });
      }
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: "<p>مقال مجدول عبر التليجرام.</p>",
          status: "SCHEDULED",
          scheduledAt: date,
          authorId: admin?.id || "default",
        }
      });
      await logAction(fromId, "schedule_post", "success", { title, postId: post.id, date });
      const reply = `📅 تم جدولة المقال بنجاح!
<b>العنوان:</b> ${title}
<b>موعد النشر:</b> ${dateStr}
🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المقال</a>`;
      await sendMessage(chatId, reply);
      return ok({ scheduled: true });
    }

    if (text.startsWith("/approve ")) {
      const id = text.replace("/approve ", "").trim();
      const idea = await prisma.articleIdea.findUnique({ where: { id } });
      if (!idea) {
        await sendMessage(chatId, "❌ الفكرة غير موجودة.");
        return ok({ error: "not_found" });
      }
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(idea.title);
      const post = await prisma.post.create({
        data: {
          title: idea.title,
          slug,
          excerpt: idea.description,
          content: `<p>${idea.description || "مسودة معتمدة من فكرة."}</p>`,
          status: "DRAFT",
          authorId: admin?.id || "default",
        }
      });
      await prisma.articleIdea.update({ where: { id }, data: { status: "APPROVED" } });
      await logAction(fromId, "approve_idea", "success", { ideaId: id, postId: post.id });
      await sendMessage(chatId, `✅ تم اعتماد الفكرة وتحويلها لمسودة.\n🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المسودة</a>`);
      return ok({ approved: true });
    }

    if (text.startsWith("/reject ")) {
      const id = text.replace("/reject ", "").trim();
      await prisma.articleIdea.update({ where: { id }, data: { status: "REJECTED" } });
      await logAction(fromId, "reject_idea", "success", { ideaId: id });
      await sendMessage(chatId, `🚫 تم رفض الفكرة ${id}`);
      return ok({ rejected: true });
    }

    await sendMessage(chatId, "عذراً، لم أفهم هذا الأمر. أرسل /help لعرض الأوامر المتاحة.");
    return ok({ unknown: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    await logAction(fromId, "telegram_error", "error", { error: error instanceof Error ? error.message : "Unknown error" });
    await sendMessage(chatId, "حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة لاحقاً.");
    return ok({ error: true });
  }
}

export async function GET() {
  return ok({ status: "telegram webhook active" });
}
