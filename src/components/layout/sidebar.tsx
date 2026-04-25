"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  LayoutDashboard,
  Rss,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/cows", label: "Cows", icon: Rss },
  { href: "/anomalies", label: "Anomalies", icon: AlertTriangle },
  { href: "/ml-reports", label: "ML Reports", icon: BrainCircuit },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-slate-950 lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Smart Cattle</p>
          <p className="text-xs text-slate-400">Health Monitor</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact ?? false);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 ${active ? "text-emerald-400" : "text-slate-500"}`}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs text-slate-400">IoT stream live</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          ESP8266 &rarr; Cloud API &rarr; MongoDB
        </p>
      </div>
    </aside>
  );
}
