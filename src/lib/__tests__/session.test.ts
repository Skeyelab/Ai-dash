import { describe, it, expect, beforeEach } from "vitest";

const TEST_KEY = Buffer.alloc(32).toString("base64");

describe("session tokens", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
    delete process.env.SESSION_SECRET;
  });

  it("creates a token with nonce and signature parts", async () => {
    const { createSessionToken } = await import("../session");
    const token = await createSessionToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[0-9a-f]{64}$/); // 32 bytes = 64 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]+$/);
  });

  it("verifies a valid token", async () => {
    const { createSessionToken, verifySessionToken } = await import("../session");
    const token = await createSessionToken();
    const valid = await verifySessionToken(token);
    expect(valid).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const { createSessionToken, verifySessionToken } = await import("../session");
    const token = await createSessionToken();
    // Flip one character in the signature part
    const [nonce, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -1) + (sig.endsWith("a") ? "b" : "a");
    const valid = await verifySessionToken(`${nonce}.${tamperedSig}`);
    expect(valid).toBe(false);
  });

  it("rejects a forged static value like 'authenticated'", async () => {
    const { verifySessionToken } = await import("../session");
    expect(await verifySessionToken("authenticated")).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
    expect(await verifySessionToken("no-dot-here")).toBe(false);
  });

  it("produces different tokens on each call (random nonce)", async () => {
    const { createSessionToken } = await import("../session");
    const t1 = await createSessionToken();
    const t2 = await createSessionToken();
    expect(t1).not.toBe(t2);
  });

  it("rejects token signed with a different secret", async () => {
    vi.resetModules();
    const { createSessionToken } = await import("../session");
    const token = await createSessionToken();

    // Change the secret and re-import so the new env is used
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64");
    vi.resetModules();
    const { verifySessionToken } = await import("../session");
    const valid = await verifySessionToken(token);
    expect(valid).toBe(false);
  });
});
