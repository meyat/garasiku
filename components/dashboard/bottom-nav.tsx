"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Plus, Car, User } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/history", label: "Riwayat", icon: Calendar },
];

const itemsRight = [
  { href: "/garage", label: "Motor Saya", icon: Car },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 pb-[max(env(safe-area-inset-bottom),12px)] px-4 md:hidden">
      <nav className="flex justify-between items-center py-3 max-w-md mx-auto">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={clsx(
              "flex flex-col items-center gap-1 w-[60px] transition-colors",
              isActive(href) ? "text-brand-600" : "text-slate-400"
            )}>
            <Icon size={22} />
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        ))}

        <Link href="/garage/add"
          className="-mt-8 flex flex-col items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-300 ring-4 ring-white">
          <Plus size={24} />
        </Link>

        {itemsRight.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={clsx(
              "flex flex-col items-center gap-1 w-[60px] transition-colors",
              isActive(href) ? "text-brand-600" : "text-slate-400"
            )}>
            <Icon size={22} />
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
