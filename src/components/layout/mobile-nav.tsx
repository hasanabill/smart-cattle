"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  LayoutDashboard,
  Rss,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/cows", label: "Cows", icon: Rss },
  { href: "/daily-reports", label: "Daily", icon: CalendarDays },
  { href: "/anomalies", label: "Anomalies", icon: AlertTriangle },
  { href: "/ml-reports", label: "ML", icon: BrainCircuit },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <p className="font-bold text-slate-900">Smart Cattle</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact ?? false);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-emerald-500 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
