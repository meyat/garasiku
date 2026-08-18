import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleById } from "@/lib/services/vehicle-service";

async function addFuelLog(vehicleId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) notFound();

  const odometer = Number(formData.get("odometer") || 0);
  const liters = Number(formData.get("liters") || 0);
  const pricePerLiterRaw = formData.get("pricePerLiter");
  const totalCostRaw = formData.get("totalCost");
  const gasStation = String(formData.get("gasStation") || "").trim() || null;
  const fuelType = String(formData.get("fuelType") || "").trim() || null;
  const isFullTank = formData.get("isFullTank") === "on";
  const notes = String(formData.get("notes") || "").trim() || null;

  // --- Validation ---
  if (Number.isNaN(odometer) || odometer < 0) {
    redirect(`/garage/${vehicleId}/fuel/add?error=Odometer tidak valid`);
  }
  // Prevent silently corrupting stats: odometer must not go backwards vs current vehicle value,
  // unless the difference is clearly a typo-scale jump we should also reject.
  if (odometer < vehicle!.current_odometer) {
    redirect(
      `/garage/${vehicleId}/fuel/add?error=${encodeURIComponent(
        `Odometer (${odometer}) lebih kecil dari odometer terakhir (${vehicle!.current_odometer}). Jika ini koreksi, update data kendaraan secara manual.`
      )}`
    );
  }
  if (Number.isNaN(liters) || liters <= 0) {
    redirect(`/garage/${vehicleId}/fuel/add?error=Jumlah liter tidak valid`);
  }

  const pricePerLiter = pricePerLiterRaw ? Number(pricePerLiterRaw) : null;
  const totalCostInput = totalCostRaw ? Number(totalCostRaw) : null;

  if (pricePerLiter == null && totalCostInput == null) {
    redirect(`/garage/${vehicleId}/fuel/add?error=Isi harga per liter atau total biaya`);
  }

  // Auto-calculate whichever value is missing
  const totalCost = totalCostInput ?? (pricePerLiter! * liters);
  const finalPricePerLiter = pricePerLiter ?? (totalCostInput! / liters);

  const { error } = await supabase.from("fuel_logs").insert({
    vehicle_id: vehicleId,
    owner_id: user!.id,
    odometer,
    liters,
    price_per_liter: finalPricePerLiter,
    total_cost: totalCost,
    gas_station: gasStation,
    fuel_type: fuelType,
    is_full_tank: isFullTank,
    notes,
  });

  if (error) {
    redirect(`/garage/${vehicleId}/fuel/add?error=${encodeURIComponent(error.message)}`);
  }

  // Also log as an expense for unified ownership-cost tracking
  await supabase.from("expenses").insert({
    vehicle_id: vehicleId,
    owner_id: user!.id,
    category: "fuel",
    amount: totalCost,
    description: gasStation ? `Isi bensin di ${gasStation}` : "Isi bensin",
  });

  redirect(`/garage/${vehicleId}?tab=fuel`);
}

export default async function AddFuelLogPage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const action = addFuelLog.bind(null, params.vehicleId);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Catat Isi Bensin</h1>
      <p className="text-neutral-500 text-sm mb-6">{vehicle.nickname} · saat ini {vehicle.current_odometer.toLocaleString("id-ID")} km</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={action} className="space-y-4">
        <Field label="Odometer (km)" name="odometer" type="number" required
          defaultValue={vehicle.current_odometer} />
        <Field label="Jumlah (Liter)" name="liters" type="number" step="0.01" required />
        <Field label="Harga per Liter (Rp)" name="pricePerLiter" type="number" />
        <Field label="Total Biaya (Rp)" name="totalCost" type="number" />
        <p className="text-xs text-neutral-400 -mt-2">Isi salah satu: harga per liter ATAU total biaya, sisanya dihitung otomatis.</p>
        <Field label="SPBU (opsional)" name="gasStation" placeholder="Contoh: Pertamina" />
        <Field label="Jenis Bensin (opsional)" name="fuelType" placeholder="Contoh: Pertamax" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFullTank" defaultChecked className="rounded" />
          Full tank (isi penuh) — dipakai untuk hitung efisiensi BBM
        </label>

        <Field label="Catatan (opsional)" name="notes" />

        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan
        </button>
      </form>
    </main>
  );
}

function Field({
  label, name, type = "text", placeholder, required, defaultValue, step,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; defaultValue?: string | number; step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        defaultValue={defaultValue} step={step}
        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
    </div>
  );
}
