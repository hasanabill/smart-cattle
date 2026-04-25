import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cows", label: "Cows" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/ml-reports", label: "ML Reports" },
];

export function MainNav() {
  return (
    <nav className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
