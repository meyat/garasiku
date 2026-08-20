import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";

export function AlertBanner({
  title, description, href,
}: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 bg-alert-50 border border-alert-100 p-4 rounded-2xl">
      <div className="shrink-0 w-10 h-10 bg-alert-100 text-orange-600 rounded-2xl flex items-center justify-center">
        <AlertTriangle size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-alert-900 text-sm font-bold truncate">{title}</h4>
        <p className="text-orange-700 text-xs truncate">{description}</p>
      </div>
      <ChevronRight size={18} className="text-orange-400 shrink-0" />
    </Link>
  );
}
