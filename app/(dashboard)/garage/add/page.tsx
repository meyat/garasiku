import Link from "next/link";
import { addVehicle } from "@/lib/actions/vehicle-actions";

export default function AddVehiclePage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Tambah Motor</h1>
      <p className="text-slate-500 text-sm mb-6">
        Isi info dasar kendaraan kamu, atau{" "}
        <Link href="/garage/add-with-photo" className="text-brand-600 font-medium">
          coba deteksi otomatis pakai foto
        </Link>.
      </p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={addVehicle} className="space-y-4">
        <Field label="Nama Panggilan" name="nickname" placeholder="Contoh: Si Merah" required />
        <Field label="Merek" name="brand" placeholder="Contoh: Honda" required />
        <Field label="Model" name="model" placeholder="Contoh: Vario 160" required />
        <Field label="Varian (opsional)" name="variant" placeholder="Contoh: ABS" />
        <Field label="Plat Nomor (opsional)" name="licensePlate" placeholder="Contoh: B 1234 ABC" />
        <Field label="Tahun Produksi" name="year" type="number" placeholder="2024" />
        <Field label="Odometer Saat Ini (km)" name="odometer" type="number" placeholder="18520" required />

        <button type="submit"
          className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan Kendaraan
        </button>
      </form>
    </main>
  );
}

function Field({
  label, name, type = "text", placeholder, required,
}: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2" />
    </div>
  );
}
