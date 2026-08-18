import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/brands", label: "Brand & Model" },
  { href: "/admin/components", label: "Komponen" },
  { href: "/admin/intervals", label: "Interval Servis" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="font-bold text-brand-700">GarasiKu Admin</p>
          <Link href="/dashboard" className="text-sm text-neutral-500">Kembali ke App</Link>
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-4 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="py-2 whitespace-nowrap text-neutral-600 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
