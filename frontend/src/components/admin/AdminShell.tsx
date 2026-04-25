"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Plus, FolderOpen, Tag, Image, FileEdit, Settings, Lightbulb, LogOut, Globe,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "المقالات", icon: FileText },
  { href: "/admin/posts/new", label: "إضافة مقال", icon: Plus },
  { href: "/admin/categories", label: "التصنيفات", icon: FolderOpen },
  { href: "/admin/tags", label: "الوسوم", icon: Tag },
  { href: "/admin/media", label: "الوسائط", icon: Image },
  { href: "/admin/pages", label: "الصفحات", icon: FileEdit },
  { href: "/admin/ideas", label: "أفكار المقالات", icon: Lightbulb },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export default function AdminShell({ user, children }: { user: any; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <aside className="fixed top-0 right-0 bottom-0 w-72 bg-ink-900 text-cream-50 flex flex-col">
        <div className="p-6 border-b border-cream-100/10">
          <Link href="/" className="flex items-center gap-3" data-testid="admin-home-link">
            <span className="w-10 h-10 rounded-full bg-gold-700 flex items-center justify-center">
              <span className="text-cream-50 font-amiri text-xl leading-none">م</span>
            </span>
            <div>
              <div className="font-cairo font-bold">معتز العلقمي</div>
              <div className="text-[11px] text-cream-100/60">لوحة الإدارة</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1" data-testid="admin-nav">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  active ? "bg-gold-700 text-cream-50" : "text-cream-100/80 hover:bg-cream-100/5 hover:text-cream-50"
                }`}
                data-testid={`admin-nav-${item.href.split("/").pop() || "dashboard"}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream-100/10 space-y-2">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-cream-100/80 hover:bg-cream-100/5">
            <Globe size={18} />
            <span>عرض الموقع</span>
          </Link>
          <div className="px-4 py-2 text-xs text-cream-100/60">
            <div className="font-bold text-cream-100">{user.name}</div>
            <div className="truncate">{user.email}</div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-300 hover:bg-red-500/10" data-testid="admin-logout-btn">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="ms-72 p-8 lg:p-12">{children}</main>
    </div>
  );
}
