"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { createServiceRecord, type ServiceItemInput } from "@/lib/actions/service-record-actions";

interface CompatibleComponent {
  id: string;
  name: string;
  category: string;
}

const ACTIONS: ServiceItemInput["action"][] = ["inspect", "clean", "repair", "replace", "adjust", "other"];
const ACTION_LABEL: Record<string, string> = {
  inspect: "Cek", clean: "Bersihkan", repair: "Perbaiki", replace: "Ganti", adjust: "Setel", other: "Lainnya",
};

export function ServiceForm({
  vehicleId, currentOdometer, compatibleComponents,
}: { vehicleId: string; currentOdometer: number; compatibleComponents: CompatibleComponent[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState(currentOdometer);
  const [workshopName, setWorkshopName] = useState("");
  const [mechanicName, setMechanicName] = useState("");
  const [notes, setNotes] = useState("");
  const [laborCost, setLaborCost] = useState(0);
  const [items, setItems] = useState<ServiceItemInput[]>([]);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);

  function addItem(componentId: string | null, label: string) {
    setItems((prev) => [
      ...prev,
      { componentId, componentLabel: label, action: "replace", conditionNote: "", cost: 0 },
    ]);
  }

  function updateItem(index: number, patch: Partial<ServiceItemInput>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAiSuggest() {
    setAiStatus("loading");
    try {
      const res = await fetch("/api/ai/suggest-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiStatus("error");
        return;
      }
      setAiSuggestions(data.components ?? []);
      setAiDisclaimer(data.disclaimer ?? null);
      setAiStatus("done");
    } catch {
      setAiStatus("error");
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await createServiceRecord(vehicleId, {
          serviceDate, odometer, workshopName, mechanicName, notes, laborCost, items,
        });
      } catch (e: any) {
        setError(e.message ?? "Gagal menyimpan servis");
      }
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold text-slate-700">Tanggal Servis</label>
          <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700">Odometer (km)</label>
          <input type="number" value={odometer} onChange={(e) => setOdometer(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-700">Bengkel (opsional)</label>
        <input value={workshopName} onChange={(e) => setWorkshopName(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-bold text-slate-700">Mekanik (opsional)</label>
        <input value={mechanicName} onChange={(e) => setMechanicName(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Item Servis</p>

        {compatibleComponents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {compatibleComponents
              .filter((c) => !items.some((it) => it.componentId === c.id))
              .map((c) => (
                <button key={c.id} type="button" onClick={() => addItem(c.id, c.name)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 flex items-center gap-1">
                  <Plus size={12} /> {c.name}
                </button>
              ))}
          </div>
        )}

        {compatibleComponents.length === 0 && (
          <div className="mb-3">
            {aiStatus !== "done" && (
              <button type="button" onClick={handleAiSuggest} disabled={aiStatus === "loading"}
                className="text-xs font-bold px-3 py-2 rounded-2xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center gap-1.5 disabled:opacity-60">
                {aiStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {aiStatus === "loading" ? "Menyusun saran..." : "Sarankan Komponen dengan AI"}
              </button>
            )}
            {aiStatus === "error" && (
              <p className="text-xs text-rose-500 mt-1.5">Gagal memuat saran AI, coba lagi atau tambah manual.</p>
            )}
            {aiStatus === "done" && (
              <div className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions
                    .filter((name) => !items.some((it) => it.componentLabel === name))
                    .map((name) => (
                      <button key={name} type="button" onClick={() => addItem(null, name)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border border-brand-100 bg-brand-50 text-brand-700 flex items-center gap-1">
                        <Plus size={12} /> {name}
                      </button>
                    ))}
                </div>
                {aiDisclaimer && <p className="text-[11px] text-slate-400 mt-2">{aiDisclaimer}</p>}
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={() => addItem(null, "")}
          className="text-xs text-brand-600 font-bold mb-3">
          + Item lain (tidak ada di daftar)
        </button>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                {item.componentId ? (
                  <p className="font-bold text-sm text-slate-800">{item.componentLabel}</p>
                ) : (
                  <input placeholder="Nama item" value={item.componentLabel}
                    onChange={(e) => updateItem(i, { componentLabel: e.target.value })}
                    className="text-sm font-bold border-b border-slate-300 focus:outline-none" />
                )}
                <button type="button" onClick={() => removeItem(i)} className="text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={item.action} onChange={(e) => updateItem(i, { action: e.target.value as any })}
                  className="text-sm rounded-xl border border-slate-200 px-2 py-1.5">
                  {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
                </select>
                <input type="number" placeholder="Biaya (Rp)" value={item.cost || ""}
                  onChange={(e) => updateItem(i, { cost: Number(e.target.value) })}
                  className="text-sm rounded-xl border border-slate-200 px-2 py-1.5" />
              </div>
              <input placeholder="Catatan kondisi (opsional)" value={item.conditionNote}
                onChange={(e) => updateItem(i, { conditionNote: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-200 px-2 py-1.5" />
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400">Belum ada item. Pilih komponen di atas.</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-700">Biaya Jasa/Ongkos (Rp)</label>
        <input type="number" value={laborCost || ""} onChange={(e) => setLaborCost(Number(e.target.value))}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-bold text-slate-700">Catatan (opsional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2" rows={2} />
      </div>

      <button type="button" disabled={isPending} onClick={handleSubmit}
        className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-bold disabled:opacity-50">
        {isPending ? "Menyimpan..." : "Simpan Servis"}
      </button>
    </div>
  );
}
