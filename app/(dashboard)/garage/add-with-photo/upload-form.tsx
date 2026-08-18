"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { saveDetectedVehicle } from "@/lib/actions/vehicle-actions";

interface DetectionResult {
  brandGuess: string;
  modelGuess: string;
  variantGuess: string | null;
  yearRangeGuess: string | null;
  confidence: number;
}

interface VariantMatch {
  variantId: string;
  brandName: string;
  modelName: string;
  variantName: string;
  years: number[];
}

export function AiVehicleUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "detecting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [matches, setMatches] = useState<VariantMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<VariantMatch | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setDetection(null);
    setMatches([]);
    setSelectedMatch(null);
    setConfirmed(false);
  }

  async function handleDetect() {
    if (!file) return;
    setStatus("detecting");
    setErrorMsg(null);

    const fd = new FormData();
    fd.append("photo", file);

    try {
      const res = await fetch("/api/ai/detect-vehicle", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Deteksi gagal");
        setStatus("error");
        return;
      }
      if (!data.detection) {
        setErrorMsg(data.message ?? "Tidak dapat mengidentifikasi motor ini. Silakan isi manual.");
        setStatus("error");
        return;
      }
      setDetection(data.detection);
      setMatches(data.matches ?? []);
      setStatus("done");
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setStatus("error");
    }
  }

  if (confirmed && detection) {
    const year = selectedMatch?.years?.[0] ?? null;
    return (
      <form action={saveDetectedVehicle} className="space-y-4">
        <input type="hidden" name="variantId" value={selectedMatch?.variantId ?? ""} />
        <input type="hidden" name="brandName" value={selectedMatch?.brandName ?? detection.brandGuess} />
        <input type="hidden" name="modelName" value={selectedMatch?.modelName ?? detection.modelGuess} />
        <input type="hidden" name="variantName" value={selectedMatch?.variantName ?? detection.variantGuess ?? ""} />
        {year && <input type="hidden" name="year" value={year} />}

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-2">
          <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            {selectedMatch
              ? `${selectedMatch.brandName} ${selectedMatch.modelName} ${selectedMatch.variantName}`
              : `${detection.brandGuess} ${detection.modelGuess} (belum ada di database, akan disimpan sebagai entri manual)`}
          </p>
        </div>

        <Field label="Nama Panggilan" name="nickname" placeholder="Contoh: Si Merah" required />
        <Field label="Odometer Saat Ini (km)" name="odometer" type="number" required />

        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan Kendaraan
        </button>
      </form>
    );
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
            <p className="text-sm">Tap untuk unggah foto motor</p>
          </div>
        )}
      </label>

      {file && status !== "done" && (
        <button type="button" onClick={handleDetect} disabled={status === "detecting"}
          className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {status === "detecting" && <Loader2 size={16} className="animate-spin" />}
          {status === "detecting" ? "Mendeteksi..." : "Deteksi dengan AI"}
        </button>
      )}

      {errorMsg && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      {status === "done" && detection && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-900">
              Perkiraan: {detection.brandGuess} {detection.modelGuess} {detection.variantGuess ?? ""}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {detection.yearRangeGuess ?? "Tahun tidak diketahui"} · Keyakinan {(detection.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Ini hanya perkiraan AI — konfirmasi motor yang benar di bawah sebelum disimpan.
            </p>
          </div>

          <p className="text-sm font-medium">Pilih motor yang cocok:</p>
          {matches.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Tidak ditemukan kecocokan persis di database. Kamu tetap bisa lanjut dengan data perkiraan di atas.
            </p>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <button key={m.variantId} type="button" onClick={() => setSelectedMatch(m)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm ${
                    selectedMatch?.variantId === m.variantId
                      ? "border-brand-600 bg-brand-50"
                      : "border-neutral-200 bg-white"
                  }`}>
                  {m.brandName} {m.modelName} {m.variantName}
                  {m.years.length > 0 && <span className="text-neutral-400"> · {m.years.join(", ")}</span>}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setConfirmed(true)}
            className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
            Konfirmasi & Lanjutkan
          </button>
        </div>
      )}
    </div>
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
