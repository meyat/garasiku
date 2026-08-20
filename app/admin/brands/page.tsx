import { createClient } from "@/lib/supabase/server";
import { addBrand, addModel, addVariant } from "@/lib/actions/admin-actions";

export default async function AdminBrandsPage() {
  const supabase = createClient();

  const { data: brands } = await supabase
    .from("vehicle_brands")
    .select("id, name, vehicle_models(id, name, vehicle_variants(id, name, vehicle_variant_years(year)))")
    .order("name");

  const allModels = (brands ?? []).flatMap((b: any) =>
    (b.vehicle_models ?? []).map((m: any) => ({ id: m.id, label: `${b.name} — ${m.name}` }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Brand & Model</h1>
        <p className="text-sm text-slate-400 mb-4">
          Tambahkan motor baru ke database tanpa perlu ubah kode aplikasi.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <form action={addBrand} className="bg-white border border-slate-100 shadow-card rounded-3xl p-4 space-y-2">
            <p className="font-bold text-sm text-slate-800">Tambah Brand</p>
            <input name="name" placeholder="Contoh: Yamaha" required
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="w-full rounded-2xl bg-brand-600 text-white py-2 text-sm font-bold">Tambah</button>
          </form>

          <form action={addModel} className="bg-white border border-slate-100 shadow-card rounded-3xl p-4 space-y-2">
            <p className="font-bold text-sm text-slate-800">Tambah Model</p>
            <select name="brandId" required className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Pilih Brand</option>
              {(brands ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input name="name" placeholder="Contoh: NMAX" required
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="w-full rounded-2xl bg-brand-600 text-white py-2 text-sm font-bold">Tambah</button>
          </form>

          <form action={addVariant} className="bg-white border border-slate-100 shadow-card rounded-3xl p-4 space-y-2">
            <p className="font-bold text-sm text-slate-800">Tambah Varian</p>
            <select name="modelId" required className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Pilih Model</option>
              {allModels.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <input name="name" placeholder="Contoh: ABS / Turbo" required
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="engineCc" type="number" placeholder="CC" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
              <input name="year" type="number" placeholder="Tahun" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <select name="transmission" className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Transmisi</option>
              <option value="automatic">Otomatis</option>
              <option value="manual">Manual</option>
              <option value="semi-automatic">Semi-otomatis</option>
            </select>
            <button className="w-full rounded-2xl bg-brand-600 text-white py-2 text-sm font-bold">Tambah</button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-sm text-slate-800 mb-2">Database Saat Ini</h2>
        <div className="space-y-3">
          {(brands ?? []).map((b: any) => (
            <div key={b.id} className="bg-white border border-slate-100 rounded-3xl p-4">
              <p className="font-bold text-sm text-slate-800">{b.name}</p>
              <div className="mt-2 space-y-1">
                {(b.vehicle_models ?? []).map((m: any) => (
                  <div key={m.id} className="text-sm text-slate-500 pl-3 border-l-2 border-slate-100">
                    {m.name}:{" "}
                    {(m.vehicle_variants ?? []).map((v: any) => (
                      <span key={v.id} className="text-slate-500">
                        {v.name}
                        {v.vehicle_variant_years?.length > 0 &&
                          ` (${v.vehicle_variant_years.map((y: any) => y.year).join(", ")})`}
                        {"  "}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
