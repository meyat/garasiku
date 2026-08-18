"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Warehouse, PlusCircle, History, User } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/garage", label: "Garage", icon: Warehouse },
  { href: "/garage/add", label: "Add", icon: PlusCircle },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex flex-col items-center gap-1 py-2.5 text-xs",
                active ? "text-brand-600" : "text-neutral-400"
              )}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
