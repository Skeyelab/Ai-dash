import type { ProviderStats } from "./openai";
import { fetchWithTimeout } from "./utils";

export async function testKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/auth/key",
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (res.status === 401) return { ok: false, message: "Invalid API key" };
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}: ${res.statusText}` };
    return { ok: true, message: "Key is valid" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

export async function fetchStats(apiKey: string): Promise<ProviderStats> {
  let balance: { amount: number | null; currency: string | null; unit: string | null } | null = null;
  let raw: unknown = {};

  try {
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/auth/key",
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (res.ok) {
      const data = await res.json();
      raw = data;
      const credits = data?.data?.limit_remaining ?? data?.data?.usage;
      const limit = data?.data?.limit;
      balance = {
        amount: typeof credits === "number" ? credits : null,
        currency: "credits",
        unit: limit ? `of ${limit} credits` : "credits",
      };
    }
  } catch {
    // ignore
  }

  return {
    provider: "openrouter",
    balance,
    usage: null,
    raw,
  };
}
