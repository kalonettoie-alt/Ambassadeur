"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Saisie", icon: "➕" },
  { href: "/affilies", label: "Affiliés", icon: "👥" },
  { href: "/tableau", label: "Tableau", icon: "📊" },
  { href: "/paiements", label: "Paiements", icon: "💸" },
  { href: "/reglages", label: "Réglages", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-16 flex-col items-center justify-center text-xs ${
                  active ? "font-bold text-emerald-700" : "text-stone-600"
                }`}
              >
                <span className="text-xl" aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
