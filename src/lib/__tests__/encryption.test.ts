import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt, getKeyHint } from "../encryption";

const TEST_KEY = Buffer.alloc(32).toString("base64"); // 32 zero bytes

describe("encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it("encrypts and decrypts roundtrip", () => {
    const plaintext = "sk-test-key-12345678901234567890";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for same input (random IV)", () => {
    const plaintext = "same-input";
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
  });

  it("getKeyHint returns last 4 chars", () => {
    expect(getKeyHint("sk-abcdefghij1234")).toBe("1234");
    expect(getKeyHint("sk-test")).toBe("test");
  });

  it("throws if ENCRYPTION_KEY is not set", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
  });

  it("throws if ENCRYPTION_KEY is wrong length", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encrypt("test")).toThrow("32 bytes");
  });
});
