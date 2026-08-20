import Link from "next/link";
import { getUserVehicles } from "@/lib/services/vehicle-service";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { ChevronRight, Plus } from "lucide-react";

export default async function GarageListPage() {
  const vehicles = await getUserVehicles();

  return (
    <main className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Garasi</h1>
      <p className="text-slate-400 text-sm mb-6">Semua kendaraan kamu di GarasiKu.</p>

      {vehicles.length === 0 ? (
        <div className="text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <p className="text-slate-500">Belum ada kendaraan di GarasiKu.</p>
          <Link href="/garage/add"
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold">
            <Plus size={16} /> Tambah Motor
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/garage/${v.id}`}
              className="flex items-center justify-between bg-white rounded-3xl border border-slate-100 shadow-card p-4">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{v.nickname}</p>
                <p className="text-sm text-slate-400 truncate">
                  {v.brand_name} {v.model_name} {v.variant_name ?? ""} · {v.current_odometer.toLocaleString("id-ID")} km
                </p>
                {v.license_plate && (
                  <span className="inline-block mt-1.5 text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                    {v.license_plate}
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-slate-300 shrink-0 ml-2" />
            </Link>
          ))}
          <Link href="/garage/add"
            className="flex items-center justify-center gap-1.5 text-center text-sm text-brand-600 font-bold border border-dashed border-slate-300 rounded-3xl py-3">
            <Plus size={16} /> Motor Baru
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
