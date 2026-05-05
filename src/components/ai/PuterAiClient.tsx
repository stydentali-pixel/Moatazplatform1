"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

type ToolMode = "assistant" | "article" | "script" | "telegram";

type Preset = {
  id: string;
  label: string;
  prompt: string;
};

type Props = {
  mode?: ToolMode;
  title?: string;
  description?: string;
  compact?: boolean;
};

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
      };
    };
  }
}

const presetsByMode: Record<ToolMode, Preset[]> = {
  assistant: [
    { id: "general", label: "مساعد عام", prompt: "أجب باللغة العربية بوضوح وتنظيم. إذا كان الطلب برمجيًا فاكتب الكود كاملًا مع طريقة التشغيل. الطلب:\n\n" },
    { id: "explain", label: "شرح كود", prompt: "اشرح الكود التالي بالعربية، واذكر وظيفته، الملفات المرتبطة به، والمشاكل المحتملة إن وجدت:\n\n" },
    { id: "fix", label: "إصلاح خطأ", prompt: "حلّل الخطأ التالي، ثم أعطني سبب المشكلة وخطوات الإصلاح والكود المصحح إن لزم:\n\n" },
  ],
  article: [
    { id: "summary", label: "تلخيص مقال", prompt: "لخّص النص التالي بالعربية في نقاط واضحة، ثم اكتب خلاصة قصيرة تصلح في بداية المقال:\n\n" },
    { id: "seo", label: "SEO للمقال", prompt: "استخرج من النص التالي: عنوان SEO، وصف meta، كلمات مفتاحية، 5 عناوين فرعية، واقتراح رابط slug بالإنجليزية:\n\n" },
    { id: "rewrite", label: "إعادة صياغة", prompt: "أعد صياغة النص التالي بأسلوب عربي فصيح وواضح مع الحفاظ على المعنى وتجنب الحشو:\n\n" },
    { id: "collect", label: "تجميع مقال", prompt: "حوّل الملاحظات التالية إلى مقال عربي منظم يحتوي على مقدمة، عناوين فرعية، وخاتمة:\n\n" },
  ],
  script: [
    { id: "create-script", label: "إنشاء سكربت", prompt: "أنت مساعد برمجي. أنشئ سكربتًا كاملًا حسب الطلب التالي. اذكر أسماء الملفات، الكود، طريقة التشغيل، والمتغيرات البيئية المطلوبة بدون مفاتيح حقيقية:\n\n" },
    { id: "telegram-bot", label: "بوت تليجرام", prompt: "صمّم حل بوت تليجرام حسب الطلب التالي. استخدم بنية آمنة، أزرار واضحة، شرح التشغيل، وطريقة النشر:\n\n" },
    { id: "project-plan", label: "خطة مشروع", prompt: "حوّل الفكرة التالية إلى خطة مشروع برمجية: المزايا، الصفحات، قاعدة البيانات، API، الملفات، وخطوات التنفيذ:\n\n" },
  ],
  telegram: [
    { id: "bot-helper", label: "مساعد البوت", prompt: "أنت مساعد برمجة داخل Telegram Web App. ساعد المستخدم في كتابة سكربتات وبوتات وأدوات موقعه. أجب بالعربية وبشكل عملي:\n\n" },
    { id: "article-helper", label: "مساعد المقالات", prompt: "ساعدني في تلخيص أو تجميع أو تحسين المقال التالي للنشر في منصة عربية. أعطني نتيجة جاهزة ومنظمة:\n\n" },
  ],
};

const modeLabels: Record<ToolMode, string> = {
  assistant: "مساعد AI",
  article: "أدوات المقالات",
  script: "مساعد السكربتات",
  telegram: "مساعد البوت والموقع",
};

function defaultDescription(mode: ToolMode) {
  if (mode === "article") return "لخّص المقالات، حسّن SEO، أعد الصياغة، أو حوّل الملاحظات إلى مقال جاهز.";
  if (mode === "script") return "اكتب سكربتات، أصلح أخطاء، أو خطط مشروعك البرمجي بخطوات عملية.";
  if (mode === "telegram") return "واجهة خفيفة يمكن فتحها من بوت تليجرام لاستخدام أدوات الذكاء الاصطناعي داخل الموقع.";
  return "مساعد ذكي عام للكتابة والبرمجة والتحليل داخل المنصة.";
}

export default function PuterAiClient({ mode = "assistant", title, description, compact = false }: Props) {
  const presets = useMemo(() => presetsByMode[mode], [mode]);
  const [activePreset, setActivePreset] = useState(presets[0]?.id || "general");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [model, setModel] = useState("gpt-5.4-nano");

  const currentPreset = presets.find((preset) => preset.id === activePreset) || presets[0];

  async function runAi() {
    const cleanInput = input.trim();
    if (!cleanInput) {
      setResult("اكتب النص أو الطلب أولًا.");
      return;
    }

    if (!window.puter?.ai?.chat) {
      setResult("لم يتم تحميل Puter.js بعد. أعد المحاولة خلال لحظات أو تحقق من الاتصال.");
      return;
    }

    setLoading(true);
    setResult("جاري المعالجة...");

    try {
      const response = await window.puter.ai.chat(`${currentPreset.prompt}${cleanInput}`, {
        model,
        temperature: mode === "script" ? 0.2 : 0.5,
      });
      setResult(String(response || "لم يصل رد واضح من النموذج."));
    } catch (error) {
      setResult(error instanceof Error ? `حدث خطأ: ${error.message}` : "حدث خطأ غير معروف أثناء المعالجة.");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard?.writeText(result).catch(() => null);
  }

  return (
    <div className="rounded-[2rem] border border-ink-900/10 bg-white/85 p-4 shadow-xl shadow-ink-900/5 backdrop-blur sm:p-6 md:p-8">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 text-sm tracking-widest text-gold-700">PUTER.JS AI</div>
          <h1 className={`${compact ? "text-2xl" : "text-3xl md:text-4xl"} font-cairo font-extrabold text-ink-900`}>
            {title || modeLabels[mode]}
          </h1>
          <p className="mt-3 max-w-2xl leading-8 text-ink-600">{description || defaultDescription(mode)}</p>
        </div>
        <div className="rounded-2xl border border-gold-700/20 bg-gold-50 px-4 py-3 text-sm text-ink-700">
          الحالة: {scriptReady ? "جاهز" : "تحميل المكتبة..."}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-bold text-ink-800">نوع المهمة</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setActivePreset(preset.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${activePreset === preset.id ? "border-gold-700 bg-gold-700 text-cream-50" : "border-ink-900/10 bg-cream-50 text-ink-700 hover:border-gold-700 hover:text-gold-700"}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink-800">النموذج</label>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm outline-none transition focus:border-gold-700 md:w-52"
          >
            <option value="gpt-5.4-nano">gpt-5.4-nano</option>
            <option value="gpt-5.4-mini">gpt-5.4-mini</option>
            <option value="gpt-5.4">gpt-5.4</option>
            <option value="gpt-5.3-chat">gpt-5.3-chat</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-ink-800">النص أو الطلب</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب هنا طلبك، الكود، الخطأ، المقال، أو الملاحظات..."
            className="min-h-[320px] w-full resize-y rounded-3xl border border-ink-900/10 bg-cream-50 p-5 leading-8 text-ink-800 outline-none transition focus:border-gold-700"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={runAi} disabled={loading} className="btn-gold disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "جاري المعالجة..." : "تنفيذ المهمة"}
            </button>
            <button type="button" onClick={() => setInput("")} className="btn-ghost">
              مسح النص
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-bold text-ink-800">النتيجة</label>
            <button type="button" onClick={copyResult} className="text-sm text-ink-500 transition hover:text-gold-700">
              نسخ النتيجة
            </button>
          </div>
          <pre className="min-h-[320px] whitespace-pre-wrap rounded-3xl border border-ink-900/10 bg-ink-900 p-5 text-left leading-7 text-cream-50 shadow-inner" dir="auto">
            {result || "ستظهر النتيجة هنا."}
          </pre>
        </div>
      </div>

      <p className="mt-5 text-xs leading-6 text-ink-500">
        ملاحظة: هذه الأداة تعمل من المتصفح باستخدام Puter.js. لا تضع مفاتيح API أو بيانات حساسة داخل النصوص المرسلة.
      </p>
    </div>
  );
}
