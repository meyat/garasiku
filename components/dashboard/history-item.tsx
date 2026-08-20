import { Fuel, Wrench } from "lucide-react";

export function HistoryItem({
  icon, title, subtitle, amountLabel, statusLabel,
}: {
  icon: "fuel" | "service";
  title: string;
  subtitle: string;
  amountLabel?: string;
  statusLabel?: string;
}) {
  const Icon = icon === "fuel" ? Fuel : Wrench;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <h4 className="text-slate-900 text-sm font-bold truncate">{title}</h4>
          <p className="text-slate-400 text-xs truncate">{subtitle}</p>
        </div>
      </div>
      {(amountLabel || statusLabel) && (
        <div className="text-right shrink-0 ml-2">
          {amountLabel && <p className="text-slate-900 text-sm font-bold">{amountLabel}</p>}
          {statusLabel && <span className="text-[10px] text-emerald-500 font-bold uppercase">{statusLabel}</span>}
        </div>
      )}
    </div>
  );
}
