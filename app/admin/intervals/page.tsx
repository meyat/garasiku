import { createClient } from "@/lib/supabase/server";
import { upsertInterval } from "@/lib/actions/admin-actions";
import { CompatibilityToggle } from "@/components/admin/compatibility-toggle";
import { VariantSelector } from "@/components/admin/variant-selector";

export default async function AdminIntervalsPage({
  searchParams,
}: { searchParams: { variantId?: string } }) {
  const supabase = createClient();

  const { data: variants } = await supabase
    .from("vehicle_variants")
    .select("id, name, vehicle_models(name, vehicle_brands(name))")
    .order("name");

  const variantOptions = (variants ?? []).map((v: any) => ({
    id: v.id,
    label: `${v.vehicle_models?.vehicle_brands?.name ?? ""} ${v.vehicle_models?.name ?? ""} ${v.name}`,
  }));

  const selectedVariantId = searchParams.variantId || variantOptions[0]?.id;

  const { data: categories } = await supabase
    .from("component_categories")
    .select("id, name, components(id, name)")
    .order("sort_order");

  let compatibleIds = new Set<string>();
  let intervalsMap = new Map<string, any>();

  if (selectedVariantId) {
    const { data: compat } = await supabase
      .from("vehicle_component_compatibility")
      .select("component_id")
      .eq("variant_id", selectedVariantId);
    compatibleIds = new Set((compat ?? []).map((c: any) => c.component_id));

    const { data: intervals } = await supabase
      .from("service_intervals")
      .select("*")
      .eq("variant_id", selectedVariantId);
    intervalsMap = new Map((intervals ?? []).map((i: any) => [i.component_id, i]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-1">Compatibility & Interval Servis</h1>
        <p className="text-sm text-neutral-500 mb-4">
          Ini adalah source of truth checklist perawatan aplikasi. AI tidak pernah menimpa data di sini.
        </p>

        <VariantSelector options={variantOptions} selectedVariantId={selectedVariantId} />
      </div>

      {!selectedVariantId ? (
        <p className="text-sm text-neutral-500">Belum ada varian. Tambahkan lewat halaman Brand & Model dulu.</p>
      ) : (
        <div className="space-y-4">
          {(categories ?? []).map((cat: any) => (
            <div key={cat.id} className="bg-white border border-neutral-200 rounded-xl p-4">
              <p className="font-medium text-sm mb-3">{cat.name}</p>
              <div className="space-y-2">
                {(cat.components ?? []).map((comp: any) => {
                  const linked = compatibleIds.has(comp.id);
                  const interval = intervalsMap.get(comp.id);
                  return (
                    <div key={comp.id} className="flex items-start gap-3 py-2 border-t border-neutral-100 first:border-t-0">
                      <CompatibilityToggle variantId={selectedVariantId} componentId={comp.id} linked={linked} />
                      <div className="flex-1">
                        <p className="text-sm">{comp.name}</p>
                        {linked && (
                          <form action={upsertInterval} className="mt-1 flex flex-wrap items-center gap-1.5">
                            <input type="hidden" name="variantId" value={selectedVariantId} />
                            <input type="hidden" name="componentId" value={comp.id} />
                            <input type="number" name="intervalKm" placeholder="km" defaultValue={interval?.interval_km ?? ""}
                              className="w-20 rounded border border-neutral-300 px-2 py-1 text-xs" />
                            <input type="number" name="intervalMonths" placeholder="bulan" defaultValue={interval?.interval_months ?? ""}
                              className="w-20 rounded border border-neutral-300 px-2 py-1 text-xs" />
                            <label className="flex items-center gap-1 text-xs text-neutral-500">
                              <input type="checkbox" name="inspectOnly" defaultChecked={interval?.inspect_only ?? false} />
                              Inspect only
                            </label>
                            <input name="notes" placeholder="Catatan" defaultValue={interval?.notes ?? ""}
                              className="flex-1 min-w-[100px] rounded border border-neutral-300 px-2 py-1 text-xs" />
                            <button className="text-xs bg-neutral-800 text-white px-2.5 py-1 rounded">Simpan</button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
