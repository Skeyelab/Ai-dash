import type { ProviderStats } from "./openai";

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
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      }
    );
    if (res.status === 401) return { ok: false, message: "Invalid API key" };
    if (res.status === 400) return { ok: true, message: "Key is valid" };
    if (!res.ok && res.status !== 400) return { ok: false, message: `HTTP ${res.status}: ${res.statusText}` };
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
