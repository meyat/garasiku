import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { getVehicleAccessGrants } from "@/lib/services/vehicle-access-service";
import { revokeWorkshopAccess } from "@/lib/actions/vehicle-access-actions";
import { GrantAccessForm } from "./grant-access-form";

export default async function VehicleAccessPage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const grants = await getVehicleAccessGrants(vehicle.id);
  const activeGrants = grants.filter((g) => !g.revoked_at);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Akses Bengkel</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {vehicle.nickname} · Berikan akses ke bengkel supaya mereka bisa lihat riwayat dan catat servis kendaraan ini.
      </p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <div>
        <h2 className="font-semibold mb-2">Bengkel dengan Akses</h2>
        {activeGrants.length === 0 ? (
          <p className="text-sm text-neutral-400 mb-4">Belum ada bengkel yang diberi akses.</p>
        ) : (
          <div className="space-y-2 mb-6">
            {activeGrants.map((g) => (
              <div key={g.id} className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
                <span className="text-sm font-medium">{g.workshop_name}</span>
                <form action={revokeWorkshopAccess.bind(null, g.id, vehicle.id)}>
                  <button className="text-xs text-red-500 font-medium">Cabut Akses</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="font-semibold mb-2">Beri Akses Baru</h2>
      <GrantAccessForm vehicleId={vehicle.id} />

      <p className="mt-6 text-xs text-neutral-400">
        Bengkel yang diberi akses hanya bisa melihat & mencatat servis untuk kendaraan ini —
        mereka tidak bisa melihat kendaraan lain milikmu. Kamu bisa cabut akses kapan saja.
      </p>
    </main>
  );
}
