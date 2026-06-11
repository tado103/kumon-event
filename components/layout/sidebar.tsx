"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Library, Sparkles } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/events", label: "イベント", icon: CalendarDays },
  { href: "/library", label: "ライブラリ", icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-stone-200 py-6 px-3 shrink-0">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800 leading-tight">イベントラボ</p>
          <p className="text-[10px] text-stone-400">KUMON教室</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-teal-50 text-teal-800 font-medium"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
