"use client";

import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";

export function AskAiForm({ vehicleId }: { vehicleId: string }) {
  const [symptom, setSymptom] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  async function handleAsk() {
    if (symptom.trim().length < 5) {
      setError("Jelaskan gejalanya lebih detail (minimal beberapa kata)");
      return;
    }
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/ai/suggest-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptomDescription: symptom, vehicleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendapat saran");
        setStatus("error");
        return;
      }
      setAreas(data.possibleAreas ?? []);
      setReasoning(data.reasoning ?? null);
      setDisclaimer(data.disclaimer ?? null);
      setStatus("done");
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={symptom}
        onChange={(e) => setSymptom(e.target.value)}
        placeholder="Contoh: Motor terasa getar ketika mulai jalan dari diam"
        rows={4}
        maxLength={1000}
        className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="button" onClick={handleAsk} disabled={status === "loading"}
        className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
        {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
        {status === "loading" ? "Menganalisis..." : "Tanya AI"}
      </button>

      {status === "done" && (
        <div className="space-y-3">
          {areas.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Area yang mungkin perlu dicek:</p>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <span key={a} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {reasoning && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-700">{reasoning}</p>
            </div>
          )}
          {disclaimer && (
            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3">
              {disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
