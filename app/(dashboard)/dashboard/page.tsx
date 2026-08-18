import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserVehicles } from "@/lib/services/vehicle-service";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Gauge, Fuel, Wrench } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const vehicles = await getUserVehicles();

  const firstName = user?.user_metadata?.full_name?.split(" ")?.[0] ?? "Sobat Motor";

  return (
    <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <p className="text-neutral-500">Selamat Datang 👋</p>
      <h1 className="text-xl font-bold">{firstName}</h1>

      {vehicles.length === 0 ? (
        <div className="mt-10 text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8">
          <p className="text-neutral-500">Belum ada kendaraan di GarasiKu.</p>
          <Link href="/garage/add"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
            Tambah Motor
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/garage/${v.id}`}
              className="block bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{v.nickname}</p>
                  <p className="text-sm text-neutral-500">
                    {v.brand_name} {v.model_name} {v.variant_name ?? ""} · {v.production_year ?? "-"}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Gauge size={18} className="text-brand-600" />
                  <span className="text-sm font-medium">{v.current_odometer.toLocaleString("id-ID")} km</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Fuel size={18} className="text-brand-600" />
                  <span className="text-sm font-medium text-neutral-400">—</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Wrench size={18} className="text-brand-600" />
                  <span className="text-sm font-medium text-neutral-400">—</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href="/workshop" className="mt-6 block text-center text-sm text-neutral-500 border-t border-neutral-100 pt-4">
        🔧 Punya bengkel? Buka Mode Bengkel
      </Link>

      <BottomNav />
    </main>
  );
}
