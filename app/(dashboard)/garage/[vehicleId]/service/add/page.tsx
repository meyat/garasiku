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
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Catat Servis</h1>
      <p className="text-slate-400 text-sm mb-6">
        {vehicle.nickname} · saat ini {vehicle.current_odometer.toLocaleString("id-ID")} km
      </p>

      {!vehicle.variant_id && (
        <p className="mb-4 text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-2xl px-3 py-2">
          Kendaraan belum tercocokkan ke database, jadi daftar komponen resmi belum tersedia.
          Kamu bisa minta saran AI atau tambah item manual di bawah.
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
