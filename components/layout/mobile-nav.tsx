"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Library } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/events", label: "イベント", icon: CalendarDays },
  { href: "/library", label: "ライブラリ", icon: Library },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40" style={{paddingBottom: 'env(safe-area-inset-bottom, 16px)'}}>
      <div className="flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center py-4 gap-1 text-xs transition-colors",
                active ? "text-teal-700" : "text-stone-500"
              )}
            >
              <Icon className="w-6 h-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
