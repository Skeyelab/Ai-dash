import type { ProviderStats } from "./openai";
import { fetchWithTimeout } from "./utils";

export async function testKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    // Use the models listing endpoint — authenticates without incurring inference costs
    const res = await fetchWithTimeout("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (res.status === 401) return { ok: false, message: "Invalid API key" };
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}: ${res.statusText}` };
    return { ok: true, message: "Key is valid" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

export async function fetchStats(apiKey: string): Promise<ProviderStats> {
  let keyValid = false;
  let raw: unknown = {};

  try {
    const result = await testKey(apiKey);
    keyValid = result.ok;
    raw = { keyValid, message: result.message };
  } catch {
    // ignore
  }

  return {
    provider: "anthropic",
    balance: null,
    usage: null,
    raw: { ...(raw as object), note: "Anthropic does not expose a public billing/usage API" },
  };
}
