"use client";

import Link from "next/link";
import { DEFAULT_ICON_URL } from "@/lib/content";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Plus,
  FolderOpen,
  Tag,
  Image,
  FileEdit,
  Settings,
  Lightbulb,
  LogOut,
  Globe,
  Menu,
  X,
  Activity,
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
  { href: "/admin/automation", label: "سجلات الأتمتة", icon: Activity },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

type AdminUser = { name?: string | null; email?: string | null; role?: string | null };

export default function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-72 max-w-[85vw] flex-col bg-ink-900 text-cream-50 shadow-2xl lg:shadow-none">
      <div className="flex items-center justify-between border-b border-cream-100/10 p-5 lg:p-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" data-testid="admin-home-link">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-gold-300/30">
            <img src={DEFAULT_ICON_URL} alt="منصة معتز" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-cairo font-bold">معتز العلقمي</div>
            <div className="text-[11px] text-cream-100/60">لوحة الإدارة</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-2 text-cream-100/70 hover:bg-cream-100/10 lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4" data-testid="admin-nav">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                active ? "bg-gold-700 text-cream-50" : "text-cream-100/80 hover:bg-cream-100/5 hover:text-cream-50"
              }`}
              data-testid={`admin-nav-${item.href.split("/").pop() || "dashboard"}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-cream-100/10 p-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-cream-100/80 hover:bg-cream-100/5">
          <Globe size={18} />
          <span>عرض الموقع</span>
        </Link>
        <div className="px-4 py-2 text-xs text-cream-100/60">
          <div className="truncate font-bold text-cream-100">{user.name || "مدير الموقع"}</div>
          <div className="truncate">{user.email}</div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-red-500/10" data-testid="admin-logout-btn">
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-cream-100 overflow-x-hidden" dir="rtl">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-30 lg:block">{sidebar}</div>

      {/* Mobile Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div 
          className={`absolute inset-y-0 right-0 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {sidebar}
        </div>
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-900/10 bg-cream-50/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-ink-900/10 bg-white/60 p-2 text-ink-900 shadow-sm"
          aria-label="فتح القائمة"
        >
          <Menu size={22} />
        </button>
        <div className="text-center">
          <div className="font-cairo font-extrabold text-ink-900">معتز العلقمي</div>
          <div className="text-xs text-ink-500">لوحة التحكم</div>
        </div>
        <Link href="/" className="rounded-xl border border-ink-900/10 bg-white/60 p-2 text-ink-900 shadow-sm" aria-label="عرض الموقع">
          <Globe size={22} />
        </Link>
      </header>

      <main className="min-w-0 px-4 py-5 sm:px-6 lg:me-72 lg:px-8 lg:py-10 xl:px-12">
        <div className="mx-auto w-full max-w-7xl overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
