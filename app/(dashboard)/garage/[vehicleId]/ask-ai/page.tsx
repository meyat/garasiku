import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { AskAiForm } from "./ask-ai-form";

export default async function AskAiPage({ params }: { params: { vehicleId: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Tanya Keluhan (AI)</h1>
      <p className="text-slate-500 text-sm mb-6">
        {vehicle.nickname} · Ceritakan gejala yang kamu rasakan, AI akan menyarankan area yang perlu dicek.
      </p>

      <AskAiForm vehicleId={vehicle.id} />
    </main>
  );
}
