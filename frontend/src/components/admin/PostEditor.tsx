"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Cat = { id: string; name: string };
type Tg = { id: string; name: string };

export interface PostFormData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  type: string;
  status: string;
  featured: boolean;
  categoryId: string;
  tagIds: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  scheduledAt: string;
}

const empty: PostFormData = {
  title: "", slug: "", excerpt: "", content: "", coverImage: "",
  type: "ARTICLE", status: "DRAFT", featured: false,
  categoryId: "", tagIds: [], seoTitle: "", seoDescription: "", canonicalUrl: "", scheduledAt: "",
};

export default function PostEditor({ initial, postId }: { initial?: Partial<PostFormData>; postId?: string }) {
  const router = useRouter();
  const [data, setData] = useState<PostFormData>({ ...empty, ...initial } as PostFormData);
  const [cats, setCats] = useState<Cat[]>([]);
  const [tags, setTags] = useState<Tg[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/tags", { credentials: "include" }).then((r) => r.json()),
    ]).then(([c, t]) => {
      setCats(c?.data || []);
      setTags(t?.data || []);
    });
  }, []);

  useEffect(() => {
    if (editorRef.current && data.content && editorRef.current.innerHTML !== data.content) {
      editorRef.current.innerHTML = data.content;
    }
  // eslint-disable-next-line
  }, [postId]);

  function update<K extends keyof PostFormData>(k: K, v: PostFormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function toggleTag(id: string) {
    setData((d) => ({ ...d, tagIds: d.tagIds.includes(id) ? d.tagIds.filter((x) => x !== id) : [...d.tagIds, id] }));
  }

  async function uploadCover(file: File) {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/media", { method: "POST", body: fd, credentials: "include" });
      const j = await r.json();
      if (j?.success) update("coverImage", j.data.url);
      else setError(j?.error || "فشل الرفع");
    } finally {
      setUploadingCover(false);
    }
  }

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    if (editorRef.current) update("content", editorRef.current.innerHTML);
  }

  async function save(targetStatus?: string) {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...data,
        status: targetStatus || data.status,
        content: editorRef.current?.innerHTML || data.content,
      };
      const url = postId ? `/api/admin/posts/${postId}` : "/api/admin/posts";
      const method = postId ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setError(typeof j.error === "string" ? j.error : "فشل الحفظ");
        return;
      }
      if (!postId) {
        router.push(`/admin/posts/${j.data.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const TYPES = ["ARTICLE", "STORY", "LINK", "IMAGE", "VIDEO", "QUOTE"];
  const TYPE_AR: Record<string, string> = { ARTICLE: "مقال", STORY: "قصة", LINK: "رابط", IMAGE: "صورة", VIDEO: "فيديو", QUOTE: "اقتباس" };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/posts" className="text-sm text-ink-500 hover:text-gold-700">→ العودة للقائمة</Link>
          <h1 className="font-cairo text-3xl font-extrabold text-ink-900 mt-2">{postId ? "تعديل مقال" : "مقال جديد"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save("DRAFT")} disabled={saving} className="btn-ghost text-sm py-2 px-4" data-testid="save-draft-btn">حفظ كمسوّدة</button>
          <button onClick={() => save("PUBLISHED")} disabled={saving} className="btn-gold text-sm py-2 px-4" data-testid="publish-btn">نشر</button>
        </div>
      </div>

      {error ? <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" data-testid="editor-error">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px] lg:gap-8">
        {/* Main editor */}
        <div className="space-y-6">
          <div className="card p-6">
            <input
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="عنوان المقال…"
              className="w-full bg-transparent font-cairo text-2xl font-extrabold text-ink-900 placeholder:text-ink-300 focus:outline-none sm:text-3xl"
              data-testid="editor-title-input"
            />
            <textarea
              value={data.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder="مقتطف يَلْفت القارئ…"
              rows={2}
              className="mt-4 w-full text-ink-600 leading-7 placeholder:text-ink-300 focus:outline-none bg-transparent resize-none"
              data-testid="editor-excerpt-input"
            />
          </div>

          <div className="card p-6">
            <div className="text-xs text-ink-500 mb-2">صورة الغلاف</div>
            {data.coverImage ? (
              <div className="relative">
                <img src={data.coverImage} alt="cover" className="rounded-xl w-full aspect-[16/9] object-cover" />
                <button onClick={() => update("coverImage", "")} className="absolute top-3 left-3 bg-ink-900/80 text-cream-50 rounded-full px-3 py-1 text-xs">إزالة</button>
              </div>
            ) : null}
            <label className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full border border-ink-900/10 text-ink-700 hover:border-gold-500 hover:text-gold-700 cursor-pointer text-sm" data-testid="editor-cover-upload-label">
              {uploadingCover ? "جاري الرفع..." : "رفع صورة غلاف"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} data-testid="editor-cover-upload-input"/>
            </label>
            <input
              value={data.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="أو ألصق رابط صورة..."
              className="mt-3 w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold-500"
              data-testid="editor-cover-url-input"
            />
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap gap-2 mb-3 border-b border-ink-900/5 pb-3" data-testid="editor-toolbar">
              <ToolbarBtn onClick={() => exec("formatBlock", "h2")}>عنوان كبير</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "h3")}>عنوان</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "p")}>فقرة</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("bold")}><b>غامق</b></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("italic")}><i>مائل</i></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("insertUnorderedList")}>قائمة</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("insertOrderedList")}>قائمة مرقّمة</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "blockquote")}>اقتباس</ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "pre")}>كود</ToolbarBtn>
              <ToolbarBtn onClick={() => {
                const url = prompt("رابط");
                if (url) exec("createLink", url);
              }}>رابط</ToolbarBtn>
              <ToolbarBtn onClick={() => {
                const url = prompt("رابط الصورة");
                if (url) exec("insertImage", url);
              }}>صورة</ToolbarBtn>
            </div>
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => update("content", (e.currentTarget as HTMLDivElement).innerHTML)}
              suppressContentEditableWarning
              className="prose-rtl min-h-[280px] max-w-none overflow-x-auto focus:outline-none sm:min-h-[400px]"
              data-testid="editor-content"
            />
          </div>

          <div className="card p-6">
            <h3 className="font-cairo font-bold text-ink-900 mb-3">تحسين الظهور (SEO)</h3>
            <label className="block mb-3">
              <span className="block text-xs text-ink-500 mb-1">عنوان SEO</span>
              <input value={data.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-seo-title"/>
            </label>
            <label className="block mb-3">
              <span className="block text-xs text-ink-500 mb-1">وصف SEO</span>
              <textarea rows={2} value={data.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-seo-description"/>
            </label>
            <label className="block">
              <span className="block text-xs text-ink-500 mb-1">Canonical URL</span>
              <input value={data.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="https://..." className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-canonical"/>
            </label>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-cairo font-bold text-ink-900 mb-3">التفاصيل</h3>
            <label className="block mb-3">
              <span className="block text-xs text-ink-500 mb-1">الرابط (slug)</span>
              <input value={data.slug} onChange={(e) => update("slug", e.target.value)} placeholder="يُولَّد تلقائياً" className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm font-mono text-xs" data-testid="editor-slug"/>
            </label>
            <label className="block mb-3">
              <span className="block text-xs text-ink-500 mb-1">النوع</span>
              <select value={data.type} onChange={(e) => update("type", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-type">
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_AR[t]}</option>)}
              </select>
            </label>
            <label className="block mb-3">
              <span className="block text-xs text-ink-500 mb-1">الحالة</span>
              <select value={data.status} onChange={(e) => update("status", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-status">
                <option value="DRAFT">مسودة</option>
                <option value="PUBLISHED">منشور</option>
                <option value="SCHEDULED">مجدول</option>
                <option value="ARCHIVED">مؤرشف</option>
              </select>
            </label>
            {data.status === "SCHEDULED" ? (
              <label className="block mb-3">
                <span className="block text-xs text-ink-500 mb-1">تاريخ النشر المجدول</span>
                <input type="datetime-local" value={data.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-scheduled"/>
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-ink-700 mt-2">
              <input type="checkbox" checked={data.featured} onChange={(e) => update("featured", e.target.checked)} data-testid="editor-featured"/>
              مقال مميّز (يظهر في الرئيسية)
            </label>
          </div>

          <div className="card p-6">
            <h3 className="font-cairo font-bold text-ink-900 mb-3">التصنيف</h3>
            <select value={data.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="editor-category">
              <option value="">— بدون تصنيف —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="card p-6">
            <h3 className="font-cairo font-bold text-ink-900 mb-3">الوسوم</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`chip ${data.tagIds.includes(t.id) ? "chip-active" : ""}`}
                  data-testid={`editor-tag-${t.id}`}
                >
                  #{t.name}
                </button>
              ))}
              {tags.length === 0 ? <div className="text-xs text-ink-500">لا توجد وسوم — أضفها من قسم الوسوم</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-1 rounded-lg bg-cream-50 border border-ink-900/10 text-ink-700 hover:border-gold-500 hover:text-gold-700 transition-colors text-sm">{children}</button>
  );
}
