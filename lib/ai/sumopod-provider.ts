import "server-only";
import type {
  AIProvider,
  VehicleDetectionResult,
  DamageInspectionResult,
  MaintenanceSuggestionResult,
  ComponentSuggestionResult,
} from "./provider";

const DAMAGE_DISCLAIMER =
  "Hasil ini hanya perkiraan visual dari foto eksterior. AI tidak dapat menilai kondisi internal " +
  "seperti oli mesin, keausan CVT, kondisi bearing, kerusakan mesin internal, atau ketebalan kampas " +
  "rem yang tidak terlihat langsung. Selalu konfirmasi dengan pemeriksaan fisik atau mekanik.";

const MAINTENANCE_DISCLAIMER =
  "Ini adalah saran area pemeriksaan berdasarkan gejala yang kamu jelaskan, bukan diagnosis pasti. " +
  "Kondisi sebenarnya harus dikonfirmasi oleh mekanik melalui pemeriksaan langsung.";

const COMPONENT_DISCLAIMER =
  "Daftar ini adalah perkiraan AI berdasarkan jenis kendaraan, bukan data compatibility resmi. " +
  "Komponen sebenarnya bisa berbeda — pilih hanya yang benar-benar relevan untuk servis ini.";

const SUMOPOD_BASE_URL = "https://ai.sumopod.com/v1";

/**
 * SumoPod AI implementation — an OpenAI-compatible API gateway.
 * Docs / key: https://ai.sumopod.com -> AI tab -> API Keys.
 * Uses the standard /chat/completions endpoint with an Authorization: Bearer header,
 * so this reuses the OpenAI vision message format (image_url with a data: URL).
 *
 * Swap `AI_PROVIDER=sumopod` in env to activate this instead of AnthropicAIProvider —
 * see the factory in this file's sibling, or wire it directly into getAIProvider() below.
 */
export class SumopodAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not set");
    this.apiKey = key;
    // Any SumoPod-catalog model works here; claude-sonnet-4-6 is a solid default for vision + JSON.
    this.model = process.env.AI_MODEL || "claude-sonnet-4-6";
  }

  private async chatJSON(messages: any[], maxTokens = 500): Promise<any | null> {
    const response = await fetch(`${SUMOPOD_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    try {
      const cleaned = String(text).replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  async detectVehicle(imageBase64: string): Promise<VehicleDetectionResult | null> {
    const prompt = `You are helping identify a motorcycle from a photo for a maintenance-tracking app.
Respond ONLY with JSON, no preamble, in this exact shape:
{"brandGuess": string, "modelGuess": string, "variantGuess": string | null, "yearRangeGuess": string | null, "confidence": number between 0 and 1}
If you cannot identify the motorcycle with reasonable confidence, set confidence to a low value (below 0.4) rather than guessing wildly.`;

    const parsed = await this.chatJSON([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ]);

    if (!parsed || typeof parsed.confidence !== "number") return null;
    return parsed as VehicleDetectionResult;
  }

  async inspectDamage(imageBase64: string): Promise<DamageInspectionResult> {
    const prompt = `Look at this motorcycle photo and identify only VISIBLE EXTERNAL issues
(scratches, cracked body panels, broken lights, damaged mirrors, visible tire wear, rust/corrosion,
obvious external damage). Do not speculate about internal mechanical condition.
Respond ONLY with JSON: {"findings": [{"label": string, "severity": "minor"|"moderate"|"severe", "confidence": number}]}`;

    const parsed = await this.chatJSON(
      [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      600
    );

    return { findings: parsed?.findings ?? [], disclaimer: DAMAGE_DISCLAIMER };
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

    const parsed = await this.chatJSON([{ role: "user", content: prompt }], 400);

    if (!parsed) {
      return { possibleAreas: [], reasoning: "Tidak dapat menghubungi layanan AI saat ini.", disclaimer: MAINTENANCE_DISCLAIMER };
    }
    return {
      possibleAreas: parsed.possibleAreas ?? [],
      reasoning: parsed.reasoning ?? "",
      disclaimer: MAINTENANCE_DISCLAIMER,
    };
  }

  async suggestComponents(vehicleDescription: string): Promise<ComponentSuggestionResult> {
    const prompt = `List the common serviceable components/spare parts for this vehicle, grouped
mentally by engine/transmission/brakes/electrical/body but returned as a flat list of short names
in Indonesian (e.g. "Oli Mesin", "Kampas Rem Depan", "Aki", "Filter Udara").
Vehicle: ${vehicleDescription}
Respond ONLY with JSON: {"components": string[]}
Keep it to the 10-15 most commonly serviced items, not an exhaustive parts catalog.`;

    const parsed = await this.chatJSON([{ role: "user", content: prompt }], 400);

    if (!parsed) return { components: [], disclaimer: COMPONENT_DISCLAIMER };
    return { components: parsed.components ?? [], disclaimer: COMPONENT_DISCLAIMER };
  }
}
