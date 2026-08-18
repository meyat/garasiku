import "server-only";
import type {
  AIProvider,
  VehicleDetectionResult,
  DamageInspectionResult,
  MaintenanceSuggestionResult,
} from "./provider";

const DAMAGE_DISCLAIMER =
  "Hasil ini hanya perkiraan visual dari foto eksterior. AI tidak dapat menilai kondisi internal " +
  "seperti oli mesin, keausan CVT, kondisi bearing, kerusakan mesin internal, atau ketebalan kampas " +
  "rem yang tidak terlihat langsung. Selalu konfirmasi dengan pemeriksaan fisik atau mekanik.";

const MAINTENANCE_DISCLAIMER =
  "Ini adalah saran area pemeriksaan berdasarkan gejala yang kamu jelaskan, bukan diagnosis pasti. " +
  "Kondisi sebenarnya harus dikonfirmasi oleh mekanik melalui pemeriksaan langsung.";

/**
 * Anthropic-backed implementation. Swap this file (or add a sibling implementing the
 * same AIProvider interface) to change providers without touching call sites.
 */
export class AnthropicAIProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not set");
    this.apiKey = key;
  }

  async detectVehicle(imageBase64: string): Promise<VehicleDetectionResult | null> {
    const prompt = `You are helping identify a motorcycle from a photo for a maintenance-tracking app.
Respond ONLY with JSON, no preamble, in this exact shape:
{"brandGuess": string, "modelGuess": string, "variantGuess": string | null, "yearRangeGuess": string | null, "confidence": number between 0 and 1}
If you cannot identify the motorcycle with reasonable confidence, set confidence to a low value (below 0.4) rather than guessing wildly.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = (data.content ?? []).map((c: any) => c.text ?? "").join("").trim();

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as VehicleDetectionResult;
      // Never let the model silently claim certainty it doesn't have.
      if (typeof parsed.confidence !== "number") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async inspectDamage(imageBase64: string): Promise<DamageInspectionResult> {
    const prompt = `Look at this motorcycle photo and identify only VISIBLE EXTERNAL issues
(scratches, cracked body panels, broken lights, damaged mirrors, visible tire wear, rust/corrosion,
obvious external damage). Do not speculate about internal mechanical condition.
Respond ONLY with JSON: {"findings": [{"label": string, "severity": "minor"|"moderate"|"severe", "confidence": number}]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return { findings: [], disclaimer: DAMAGE_DISCLAIMER };

    const data = await response.json();
    const text = (data.content ?? []).map((c: any) => c.text ?? "").join("").trim();

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return { findings: parsed.findings ?? [], disclaimer: DAMAGE_DISCLAIMER };
    } catch {
      return { findings: [], disclaimer: DAMAGE_DISCLAIMER };
    }
  }

  async suggestMaintenance(input: {
    symptomDescription: string;
    vehicleContext?: {
      brand: string; model: string; variant: string | null;
      currentOdometer: number; recentServiceComponents: string[];
    };
  }): Promise<MaintenanceSuggestionResult> {
    const contextLine = input.vehicleContext
      ? `Vehicle: ${input.vehicleContext.brand} ${input.vehicleContext.model} ${input.vehicleContext.variant ?? ""}, ` +
        `odometer ${input.vehicleContext.currentOdometer} km, recently serviced: ${input.vehicleContext.recentServiceComponents.join(", ") || "none recorded"}.`
      : "No vehicle context provided.";

    const prompt = `A motorcycle owner describes a symptom. Suggest which components/areas a mechanic
should INSPECT — do not claim a confirmed diagnosis, and do not invent vehicle-specific compatibility
or intervals (those come from a separate database, not you).
${contextLine}
Symptom: "${input.symptomDescription}"
Respond ONLY with JSON: {"possibleAreas": string[], "reasoning": string}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return { possibleAreas: [], reasoning: "Tidak dapat menghubungi layanan AI saat ini.", disclaimer: MAINTENANCE_DISCLAIMER };
    }

    const data = await response.json();
    const text = (data.content ?? []).map((c: any) => c.text ?? "").join("").trim();

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return { possibleAreas: parsed.possibleAreas ?? [], reasoning: parsed.reasoning ?? "", disclaimer: MAINTENANCE_DISCLAIMER };
    } catch {
      return { possibleAreas: [], reasoning: text, disclaimer: MAINTENANCE_DISCLAIMER };
    }
  }
}

