export interface ProviderStats {
  provider: "openai" | "anthropic" | "openrouter";
  balance: { amount: number | null; currency: string | null; unit: string | null } | null;
  usage: { period: string; amount: number | null; unit: string | null } | null;
  raw: unknown;
}

const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function testKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/models",
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
  let usage: { period: string; amount: number | null; unit: string | null } | null = null;
  let raw: unknown = {};

  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const usageRes = await fetchWithTimeout(
      `https://api.openai.com/v1/usage?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (usageRes.ok) {
      const data = await usageRes.json();
      raw = data;
      const totalTokens = (data.data ?? []).reduce(
        (sum: number, day: { n_context_tokens_total?: number; n_generated_tokens_total?: number }) =>
          sum + (day.n_context_tokens_total ?? 0) + (day.n_generated_tokens_total ?? 0),
        0
      );
      usage = { period: "month", amount: totalTokens, unit: "tokens" };
    }
  } catch {
    // ignore
  }

  return {
    provider: "openai",
    balance: null, // OpenAI deprecated credit balance endpoint
    usage,
    raw,
  };
}
