import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { DamageInspectionForm } from "./inspection-form";

export default async function InspectPage({ params }: { params: { vehicleId: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Cek Kondisi Motor (AI)</h1>
      <p className="text-slate-500 text-sm mb-6">
        {vehicle.nickname} · Unggah foto bagian yang ingin dicek — misalnya body, lampu, atau ban.
      </p>

      <DamageInspectionForm vehicleId={vehicle.id} />
    </main>
  );
}
