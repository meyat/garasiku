"use client";

import { useState, useTransition } from "react";
import { grantWorkshopAccess } from "@/lib/actions/vehicle-access-actions";

interface WorkshopHit {
  id: string;
  name: string;
  address: string | null;
}

export function GrantAccessForm({ vehicleId }: { vehicleId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkshopHit[]>([]);
  const [selected, setSelected] = useState<WorkshopHit | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    setSelected(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/workshops/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.workshops ?? []);
    } finally {
      setIsSearching(false);
    }
  }

  const action = grantWorkshopAccess.bind(null, vehicleId);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="workshopId" value={selected?.id ?? ""} />
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Cari nama bengkel..."
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
      />

      {isSearching && <p className="text-xs text-neutral-400">Mencari...</p>}

      {results.length > 0 && !selected && (
        <div className="space-y-1.5">
          {results.map((w) => (
            <button key={w.id} type="button" onClick={() => { setSelected(w); setQuery(w.name); setResults([]); }}
              className="w-full text-left rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
              <p className="font-medium">{w.name}</p>
              {w.address && <p className="text-xs text-neutral-500">{w.address}</p>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-800">
          Terpilih: {selected.name}
        </div>
      )}

      <button type="submit" disabled={!selected || isPending}
        className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium disabled:opacity-50">
        Beri Akses ke Bengkel Ini
      </button>
    </form>
  );
}
