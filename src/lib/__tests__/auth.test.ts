import { describe, it, expect, beforeEach, vi } from "vitest";

describe("auth credentials", () => {
  beforeEach(() => {
    process.env.BASIC_AUTH_USER = "testuser";
    process.env.BASIC_AUTH_PASS = "testpass";
  });

  it("returns env var credentials", async () => {
    vi.resetModules();
    const { getAuthCredentials } = await import("../auth");
    const creds = getAuthCredentials();
    expect(creds.username).toBe("testuser");
    expect(creds.password).toBe("testpass");
  });

  it("falls back to defaults if env vars not set", async () => {
    delete process.env.BASIC_AUTH_USER;
    delete process.env.BASIC_AUTH_PASS;
    vi.resetModules();
    const { getAuthCredentials } = await import("../auth");
    const creds = getAuthCredentials();
    expect(creds.username).toBe("admin");
    expect(creds.password).toBe("changeme");
  });
});
