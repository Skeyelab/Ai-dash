import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("OpenAI provider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("testKey returns ok on 200", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ data: [] }),
    });
    const { testKey } = await import("../providers/openai");
    const result = await testKey("sk-test");
    expect(result.ok).toBe(true);
  });

  it("testKey returns error on 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });
    vi.resetModules();
    const { testKey } = await import("../providers/openai");
    const result = await testKey("sk-invalid");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Invalid/i);
  });

  it("fetchStats returns normalized object", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { n_context_tokens_total: 1000, n_generated_tokens_total: 500 },
          { n_context_tokens_total: 2000, n_generated_tokens_total: 1000 },
        ],
      }),
    });
    vi.resetModules();
    const { fetchStats } = await import("../providers/openai");
    const stats = await fetchStats("sk-test");
    expect(stats.provider).toBe("openai");
    expect(stats.usage?.amount).toBe(4500);
    expect(stats.usage?.unit).toBe("tokens");
  });
});

describe("OpenRouter provider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("testKey returns ok on 200", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { limit_remaining: 9.5 } }),
    });
    vi.resetModules();
    const { testKey } = await import("../providers/openrouter");
    const result = await testKey("sk-or-test");
    expect(result.ok).toBe(true);
  });

  it("fetchStats returns balance from key endpoint", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { limit_remaining: 9.5, limit: 10 } }),
    });
    vi.resetModules();
    const { fetchStats } = await import("../providers/openrouter");
    const stats = await fetchStats("sk-or-test");
    expect(stats.provider).toBe("openrouter");
    expect(stats.balance?.amount).toBe(9.5);
  });
});

describe("Anthropic provider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchStats returns null balance and usage (not available)", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.resetModules();
    const { fetchStats } = await import("../providers/anthropic");
    const stats = await fetchStats("sk-ant-test");
    expect(stats.provider).toBe("anthropic");
    expect(stats.balance).toBeNull();
    expect(stats.usage).toBeNull();
  });
});
