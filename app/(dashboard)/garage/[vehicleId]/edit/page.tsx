import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { updateVehicle, archiveVehicle } from "@/lib/actions/vehicle-actions";

export default async function EditVehiclePage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const saveAction = updateVehicle.bind(null, vehicle.id);
  const archiveAction = archiveVehicle.bind(null, vehicle.id);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Edit Kendaraan</h1>
      <p className="text-slate-500 text-sm mb-6">{vehicle.nickname}</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={saveAction} className="space-y-4">
        <Field label="Nama Panggilan" name="nickname" defaultValue={vehicle.nickname} required />
        <Field label="Merek" name="brand" defaultValue={vehicle.brand_name} required />
        <Field label="Model" name="model" defaultValue={vehicle.model_name} required />
        <Field label="Varian (opsional)" name="variant" defaultValue={vehicle.variant_name ?? ""} />
        <Field label="Plat Nomor (opsional)" name="licensePlate" defaultValue={vehicle.license_plate ?? ""} placeholder="Contoh: B 1234 ABC" />
        <Field label="Tahun Produksi" name="year" type="number" defaultValue={vehicle.production_year ?? ""} />
        <Field label="Kapasitas Mesin (cc)" name="engineCc" type="number" defaultValue={vehicle.engine_cc ?? ""} />
        <Field label="Tanggal Pembelian" name="purchaseDate" type="date" defaultValue={vehicle.purchase_date ?? ""} />
        <Field label="Harga Pembelian (Rp)" name="purchasePrice" type="number" defaultValue={vehicle.purchase_price ?? ""} />
        <div>
          <label className="text-sm font-medium">Catatan</label>
          <textarea name="notes" defaultValue={vehicle.notes ?? ""} rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2" />
        </div>

        <button type="submit" className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan Perubahan
        </button>
      </form>

      <form action={archiveAction} className="mt-4">
        <button type="submit" className="w-full text-sm text-red-600 font-medium py-2">
          Arsipkan Kendaraan Ini
        </button>
      </form>
    </main>
  );
}

function Field({
  label, name, type = "text", placeholder, required, defaultValue,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; defaultValue?: string | number;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2" />
    </div>
  );
}
