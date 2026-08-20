import Link from "next/link";
import type { HealthScoreResult } from "@/lib/calculations/vehicle-health";

interface VehicleCardProps {
  vehicleId: string;
  nickname: string;
  brandModel: string; // e.g. "Vario 160 • 2024"
  odometer: number;
  fuelEfficiencyLabel: string; // e.g. "43.2 km/L" or "—"
  nextServiceLabel: string; // e.g. "800 km" or "15 Okt"
  health: HealthScoreResult;
}

const HEALTH_BADGE = (score: number) => {
  if (score >= 80) return { label: "Sehat", classes: "bg-success-500/20 text-emerald-400 border-emerald-500/30" };
  if (score >= 50) return { label: "Perlu Cek", classes: "bg-alert-500/20 text-orange-400 border-orange-500/30" };
  return { label: "Perhatian", classes: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
};

export function VehicleCard({
  vehicleId, nickname, brandModel, odometer, fuelEfficiencyLabel, nextServiceLabel, health,
}: VehicleCardProps) {
  const badge = HEALTH_BADGE(health.score);

  return (
    <Link href={`/garage/${vehicleId}`}
      className="relative block overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-elevated">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />

      <div className="relative flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold">{nickname}</h3>
          <p className="text-slate-400 text-sm">{brandModel}</p>
        </div>
        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      <div className="relative flex items-center justify-center my-4 h-20">
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55" cy="78" r="16" stroke="white" strokeWidth="5" />
          <circle cx="145" cy="78" r="16" stroke="white" strokeWidth="5" />
          <path d="M55 78 L75 48 L95 48 L110 30 L145 30 L145 48 L160 48 L145 78"
            stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="95" y="24" width="26" height="7" rx="3.5" fill="white" />
        </svg>
      </div>

      <div className="relative grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Odometer</p>
          <p className="text-sm font-semibold">{odometer.toLocaleString("id-ID")} km</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Efisiensi</p>
          <p className="text-sm font-semibold">{fuelEfficiencyLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Servis Berikutnya</p>
          <p className="text-sm font-semibold text-orange-400">{nextServiceLabel}</p>
        </div>
      </div>
    </Link>
  );
}
