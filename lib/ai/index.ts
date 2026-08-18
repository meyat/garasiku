import "server-only";
import type { AIProvider } from "./provider";
import { AnthropicAIProvider } from "./anthropic-provider";
import { SumopodAIProvider } from "./sumopod-provider";

let cachedProvider: AIProvider | null = null;

/**
 * Factory — the ONLY place that decides which AI backend is active.
 * Set env var AI_PROVIDER=sumopod or AI_PROVIDER=anthropic.
 * Nothing else in the app needs to change when switching providers, since both
 * implementations satisfy the same AIProvider interface (lib/ai/provider.ts).
 */
export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    const providerName = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
    cachedProvider = providerName === "sumopod" ? new SumopodAIProvider() : new AnthropicAIProvider();
  }
  return cachedProvider;
}
