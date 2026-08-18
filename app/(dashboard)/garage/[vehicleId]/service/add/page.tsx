import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { getCompatibleComponents } from "@/lib/services/service-record-service";
import { ServiceForm } from "./service-form";

export default async function AddServiceRecordPage({ params }: { params: { vehicleId: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const compatibleComponents = vehicle.variant_id
    ? await getCompatibleComponents(vehicle.variant_id)
    : [];

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Catat Servis</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {vehicle.nickname} · saat ini {vehicle.current_odometer.toLocaleString("id-ID")} km
      </p>

      {!vehicle.variant_id && (
        <p className="mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Kendaraan belum tercocokkan ke database, jadi daftar komponen cepat belum tersedia.
          Kamu tetap bisa tambah item servis manual di bawah.
        </p>
      )}

      <ServiceForm
        vehicleId={params.vehicleId}
        currentOdometer={vehicle.current_odometer}
        compatibleComponents={compatibleComponents}
      />
    </main>
  );
}
