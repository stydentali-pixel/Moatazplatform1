import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { uniquePostSlug, readingTimeMinutes } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Convert an idea into a Post (draft) once the admin approves it.
 * AI generation is gated behind ENABLE_AI_CONTENT — for now we generate
 * placeholder content so the workflow is fully functional.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const body = await readJson(req);
  const requestedStatus: "DRAFT" | "PUBLISHED" | "SCHEDULED" =
    body?.status === "PUBLISHED" || body?.status === "SCHEDULED" ? body.status : "DRAFT";

  if (requestedStatus !== "DRAFT" && process.env.ENABLE_DIRECT_PUBLISH !== "true") {
    return fail("النشر المباشر معطّل. الرجاء حفظ كمسوّدة ثم النشر يدوياً.", 400);
  }

  const idea = await prisma.articleIdea.findUnique({ where: { id: params.id } });
  if (!idea) return fail("الفكرة غير موجودة", 404);

  const useAI = process.env.ENABLE_AI_CONTENT === "true";
  const placeholder = useAI
    ? "<p>المحتوى المُولَّد آلياً (سيُفعَّل لاحقاً)</p>"
    : `<p>${idea.description || "هذه مسوّدة مولَّدة من فكرة. أكمل الكتابة أو ألصق المحتوى هنا."}</p>
<h2>المحاور المقترحة</h2>
<ul>
<li>المقدّمة وسبب الكتابة</li>
<li>الفكرة الأساسية</li>
<li>الأمثلة والشواهد</li>
<li>الخاتمة والدعوة</li>
</ul>`;

  const slug = await uniquePostSlug(idea.title);
  const post = await prisma.post.create({
    data: {
      title: idea.title,
      slug,
      excerpt: idea.description || null,
      content: placeholder,
      type: "ARTICLE",
      status: requestedStatus,
      readingTime: readingTimeMinutes(placeholder),
      seoTitle: idea.title,
      seoDescription: idea.description || null,
      authorId: user.id,
      publishedAt: requestedStatus === "PUBLISHED" ? new Date() : null,
      scheduledAt: requestedStatus === "SCHEDULED" && body?.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  });

  await prisma.articleIdea.update({
    where: { id: params.id },
    data: { status: requestedStatus === "PUBLISHED" ? "PUBLISHED" : requestedStatus === "SCHEDULED" ? "SCHEDULED" : "DRAFTED" },
  });

  await prisma.automationLog.create({
    data: {
      action: `idea_to_post_${requestedStatus.toLowerCase()}`,
      entity: "post",
      entityId: post.id,
      payload: JSON.stringify({ ideaId: idea.id }),
      message: `Converted idea "${idea.title}" to ${requestedStatus.toLowerCase()}`,
    },
  });

  return ok(post);
}
