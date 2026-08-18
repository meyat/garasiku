/**
 * AI provider abstraction layer.
 *
 * IMPORTANT ARCHITECTURE RULE (see spec §17-19, §39):
 * AI is only ever used to produce a *structured prediction* — brand/model/variant guess
 * with a confidence score. It is NEVER the source of truth for:
 *   - Vehicle compatibility (that's `vehicle_component_compatibility`)
 *   - Maintenance intervals (that's `service_intervals`)
 * Every AI vehicle-detection result MUST be matched against the master DB and confirmed
 * by the user before being saved to `vehicles.variant_id`.
 */

export interface VehicleDetectionResult {
  brandGuess: string;
  modelGuess: string;
  variantGuess: string | null;
  yearRangeGuess: string | null; // e.g. "2022–2024"
  confidence: number; // 0-1
}

export interface DamageInspectionFinding {
  label: string; // e.g. "Scratch on side cover"
  severity: "minor" | "moderate" | "severe";
  confidence: number;
}

export interface DamageInspectionResult {
  findings: DamageInspectionFinding[];
  disclaimer: string;
}

export interface MaintenanceSuggestionResult {
  possibleAreas: string[]; // e.g. ["CVT", "Roller", "Engine mounting"]
  reasoning: string;
  disclaimer: string;
}

export interface AIProvider {
  detectVehicle(imageBase64: string): Promise<VehicleDetectionResult | null>;
  inspectDamage(imageBase64: string): Promise<DamageInspectionResult>;
  suggestMaintenance(input: {
    symptomDescription: string;
    vehicleContext?: {
      brand: string;
      model: string;
      variant: string | null;
      currentOdometer: number;
      recentServiceComponents: string[];
    };
  }): Promise<MaintenanceSuggestionResult>;
}
