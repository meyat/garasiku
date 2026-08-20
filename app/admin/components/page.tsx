import { createClient } from "@/lib/supabase/server";
import { addComponent } from "@/lib/actions/admin-actions";

export default async function AdminComponentsPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("component_categories")
    .select("id, name, sort_order, components(id, name)")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Komponen</h1>
        <p className="text-sm text-slate-400 mb-4">
          Master daftar komponen/spare-part. Setelah ditambahkan di sini, komponen bisa dihubungkan
          ke varian kendaraan lewat halaman Interval Servis.
        </p>

        <form action={addComponent} className="bg-white border border-slate-100 shadow-card rounded-3xl p-4 flex gap-2 max-w-lg">
          <select name="categoryId" required className="rounded-2xl border border-slate-200 px-3 py-2 text-sm flex-1">
            <option value="">Kategori</option>
            {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="name" placeholder="Nama komponen" required
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm flex-1" />
          <button className="rounded-2xl bg-brand-600 text-white px-4 py-2 text-sm font-bold">Tambah</button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(categories ?? []).map((cat: any) => (
          <div key={cat.id} className="bg-white border border-slate-100 rounded-3xl p-4">
            <p className="font-bold text-sm text-slate-800 mb-2">{cat.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {(cat.components ?? []).map((comp: any) => (
                <span key={comp.id} className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {comp.name}
                </span>
              ))}
              {(cat.components ?? []).length === 0 && (
                <span className="text-xs text-slate-400">Belum ada komponen</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
