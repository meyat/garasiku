import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { REMINDER_TYPES, REMINDER_TYPE_LABEL } from "@/lib/services/reminder-service";
import { createReminder } from "@/lib/actions/reminder-actions";
import { FormField, FormError } from "@/components/ui/form-field";

export default async function AddReminderPage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const action = createReminder.bind(null, params.vehicleId);

  return (
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Tambah Pengingat</h1>
      <p className="text-slate-400 text-sm mb-6">{vehicle.nickname}</p>

      <FormError message={searchParams?.error} />

      <form action={action} className="space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700">Tipe</label>
          <select name="type" required className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5">
            {REMINDER_TYPES.map((t) => <option key={t} value={t}>{REMINDER_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <FormField label="Judul" name="title" placeholder="Contoh: Perpanjang STNK" required />
        <FormField label="Tanggal Jatuh Tempo (opsional)" name="dueDate" type="date" />
        <FormField label="Odometer Target (opsional, km)" name="dueOdometer" type="number" />
        <p className="text-xs text-slate-400">Isi minimal salah satu: tanggal atau target odometer.</p>

        <button type="submit" className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-bold">
          Simpan Pengingat
        </button>
      </form>
    </main>
  );
}
