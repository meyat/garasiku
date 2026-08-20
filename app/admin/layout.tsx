import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/users", label: "User" },
  { href: "/admin/brands", label: "Brand & Model" },
  { href: "/admin/components", label: "Komponen" },
  { href: "/admin/intervals", label: "Interval Servis" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
          <p className="font-bold text-brand-700">GarasiKu Admin</p>
          <Link href="/dashboard" className="text-sm font-bold text-slate-400">Kembali ke App</Link>
        </div>
        <nav className="max-w-4xl mx-auto px-5 flex gap-4 overflow-x-auto no-scrollbar text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="py-2 whitespace-nowrap font-bold text-slate-500 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
