import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function addVehicle(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = String(formData.get("nickname") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const variant = String(formData.get("variant") || "").trim() || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const odometer = Number(formData.get("odometer") || 0);

  if (!nickname || !brand || !model || Number.isNaN(odometer) || odometer < 0) {
    redirect("/garage/add?error=Lengkapi data kendaraan dengan benar");
  }

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: user!.id,
      nickname,
      brand_name: brand,
      model_name: model,
      variant_name: variant,
      production_year: year,
      current_odometer: odometer,
    })
    .select("id")
    .single();

  if (error || !vehicle) {
    redirect(`/garage/add?error=${encodeURIComponent(error?.message ?? "Gagal menyimpan")}`);
  }

  // Seed initial odometer history entry
  await supabase.from("odometer_logs").insert({
    vehicle_id: vehicle!.id,
    odometer,
    source: "manual",
    created_by: user!.id,
  });

  redirect(`/garage/${vehicle!.id}`);
}

export default function AddVehiclePage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Tambah Motor</h1>
      <p className="text-neutral-500 text-sm mb-6">
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
        <Field label="Tahun Produksi" name="year" type="number" placeholder="2024" />
        <Field label="Odometer Saat Ini (km)" name="odometer" type="number" placeholder="18520" required />

        <button type="submit"
          className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
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
        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
    </div>
  );
}
