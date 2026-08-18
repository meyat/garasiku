"use client";

import { useState } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface Finding {
  label: string;
  severity: "minor" | "moderate" | "severe";
  confidence: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  minor: "bg-amber-100 text-amber-700",
  moderate: "bg-orange-100 text-orange-700",
  severe: "bg-red-100 text-red-700",
};
const SEVERITY_LABEL: Record<string, string> = {
  minor: "Ringan", moderate: "Sedang", severe: "Berat",
};

export function DamageInspectionForm({ vehicleId }: { vehicleId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setFindings([]);
  }

  async function handleInspect() {
    if (!file) return;
    setStatus("loading");
    setError(null);

    const fd = new FormData();
    fd.append("photo", file);
    fd.append("vehicleId", vehicleId);

    try {
      const res = await fetch("/api/ai/inspect-damage", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa foto");
        setStatus("error");
        return;
      }
      setFindings(data.findings ?? []);
      setDisclaimer(data.disclaimer ?? null);
      setStatus("done");
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <label className="block border-2 border-dashed border-neutral-300 rounded-2xl p-6 text-center cursor-pointer">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-52 mx-auto rounded-xl object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <Upload size={28} />
            <p className="text-sm">Tap untuk unggah foto bagian motor</p>
          </div>
        )}
      </label>

      {file && (
        <button type="button" onClick={handleInspect} disabled={status === "loading"}
          className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {status === "loading" && <Loader2 size={16} className="animate-spin" />}
          {status === "loading" ? "Memeriksa..." : "Periksa dengan AI"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {status === "done" && (
        <div className="space-y-3">
          {findings.length === 0 ? (
            <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-xl p-4">
              Tidak ada masalah eksterior yang terlihat jelas dari foto ini.
            </p>
          ) : (
            <div className="space-y-2">
              {findings.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-neutral-400" />
                    <span className="text-sm">{f.label}</span>
                  </div>
                  <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", SEVERITY_COLOR[f.severity])}>
                    {SEVERITY_LABEL[f.severity] ?? f.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
          {disclaimer && (
            <p className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              {disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
