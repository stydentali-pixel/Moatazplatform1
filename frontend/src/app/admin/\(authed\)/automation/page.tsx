"use client";
import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  payload?: string | null;
  status: string;
  message?: string | null;
  createdAt: string;
};

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/automation", { credentials: "include" });
      const j = await r.json();
      setLogs(j?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-gold-700 text-sm tracking-widest mb-2">النظام</div>
          <h1 className="font-cairo text-3xl font-extrabold text-ink-900">سجلات الأتمتة</h1>
          <p className="text-ink-600 mt-2 text-sm">تتبع نشاط بوت التليجرام والعمليات التلقائية في المنصة.</p>
        </div>
        <button 
          onClick={loadLogs} 
          className="btn-gold text-xs py-2 px-4"
          disabled={loading}
        >
          {loading ? "جاري التحديث..." : "تحديث السجلات"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-cream-50 text-ink-500 border-b border-ink-900/5">
              <tr>
                <th className="px-6 py-4 font-bold">العملية</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold">التفاصيل</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-cream-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-ink-100 px-2 py-1 rounded text-ink-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      log.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                    }`}>
                      {log.status === "success" ? "نجاح" : "فشل"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-ink-600" title={log.message || ""}>
                      {log.message || "-"}
                    </div>
                    {log.payload && (
                      <details className="mt-1">
                        <summary className="text-[10px] text-gold-700 cursor-pointer hover:underline">عرض البيانات</summary>
                        <pre className="mt-2 p-2 bg-ink-900 text-cream-50 text-[10px] rounded overflow-x-auto max-w-sm">
                          {JSON.stringify(JSON.parse(log.payload), null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-6 py-4 text-ink-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-ink-400">
                    لا توجد سجلات حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
