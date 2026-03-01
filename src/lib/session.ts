// HMAC-SHA256 signed session tokens.
// Uses globalThis.crypto (Web Crypto API) which works in both Node.js 20+
// and the Next.js Edge runtime, so it is safe to import from middleware.

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!secret)
    throw new Error(
      "SESSION_SECRET or ENCRYPTION_KEY env var is required for session signing"
    );
  return secret;
}

async function importHmacKey(): Promise<CryptoKey> {
  const keyMaterial = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const pairs = hex.match(/../g) ?? [];
  const buffer = new ArrayBuffer(pairs.length);
  const view = new Uint8Array(buffer);
  pairs.forEach((h, i) => { view[i] = parseInt(h, 16); });
  return view;
}

/** Creates a signed session token: `${nonceHex}.${hmacHex}` */
export async function createSessionToken(): Promise<string> {
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const key = await importHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(nonce));
  return `${nonce}.${toHex(sig)}`;
}

/** Verifies a signed session token using a timing-safe HMAC check. */
export async function verifySessionToken(token: string): Promise<boolean> {
  const sep = token.lastIndexOf(".");
  if (sep === -1) return false;

  const nonceHex = token.slice(0, sep);
  const sigHex = token.slice(sep + 1);
  if (!nonceHex || !sigHex || sigHex.length % 2 !== 0) return false;

  try {
    const key = await importHmacKey();
    const sigBytes = fromHex(sigHex);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(nonceHex)
    );
  } catch {
    return false;
  }
}
