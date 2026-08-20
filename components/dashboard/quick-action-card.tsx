import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function QuickActionCard({
  href, icon: Icon, label,
}: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href}
      className="shrink-0 w-28 h-32 bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-3 border border-slate-100 shadow-card">
      <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold text-slate-800 text-center leading-tight">{label}</span>
    </Link>
  );
}
