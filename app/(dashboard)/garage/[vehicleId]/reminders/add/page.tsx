import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { REMINDER_TYPES, REMINDER_TYPE_LABEL } from "@/lib/services/reminder-service";
import { createReminder } from "@/lib/actions/reminder-actions";

export default async function AddReminderPage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const action = createReminder.bind(null, params.vehicleId);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Tambah Pengingat</h1>
      <p className="text-neutral-500 text-sm mb-6">{vehicle.nickname}</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Tipe</label>
          <select name="type" required className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2">
            {REMINDER_TYPES.map((t) => <option key={t} value={t}>{REMINDER_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Judul</label>
          <input name="title" required placeholder="Contoh: Perpanjang STNK"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Tanggal Jatuh Tempo (opsional)</label>
          <input name="dueDate" type="date" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Odometer Target (opsional, km)</label>
          <input name="dueOdometer" type="number" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <p className="text-xs text-neutral-400">Isi minimal salah satu: tanggal atau target odometer.</p>

        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan Pengingat
        </button>
      </form>
    </main>
  );
}
