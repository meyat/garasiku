import Link from "next/link";
import { getUserVehicles } from "@/lib/services/vehicle-service";
import { BottomNav } from "@/components/dashboard/bottom-nav";

export default async function GarageListPage() {
  const vehicles = await getUserVehicles();

  return (
    <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Garasi</h1>
      <p className="text-neutral-500 text-sm mb-6">Semua kendaraan kamu di GarasiKu.</p>

      {vehicles.length === 0 ? (
        <div className="text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8">
          <p className="text-neutral-500">Belum ada kendaraan di GarasiKu.</p>
          <Link href="/garage/add"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
            Tambah Motor
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/garage/${v.id}`}
              className="block bg-white rounded-2xl border border-neutral-200 p-4">
              <p className="font-semibold">{v.nickname}</p>
              <p className="text-sm text-neutral-500">
                {v.brand_name} {v.model_name} {v.variant_name ?? ""} · {v.current_odometer.toLocaleString("id-ID")} km
              </p>
            </Link>
          ))}
          <Link href="/garage/add"
            className="block text-center text-sm text-brand-600 font-medium border border-dashed border-neutral-300 rounded-xl py-3">
            + Motor Baru
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
