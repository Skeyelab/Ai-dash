import { prisma } from "./prisma";
import { encrypt, decrypt, getKeyHint } from "./encryption";
import type { Provider } from "@prisma/client";

export async function getCredential(provider: Provider) {
  return prisma.providerCredential.findUnique({ where: { provider } });
}

export async function getAllCredentials() {
  return prisma.providerCredential.findMany({ orderBy: { provider: "asc" } });
}

export async function upsertCredential(provider: Provider, apiKey: string) {
  const encryptedApiKey = encrypt(apiKey);
  const keyHint = getKeyHint(apiKey);
  return prisma.providerCredential.upsert({
    where: { provider },
    create: { provider, encryptedApiKey, keyHint },
    update: { encryptedApiKey, keyHint },
  });
}

export async function deleteCredential(provider: Provider) {
  return prisma.providerCredential.delete({ where: { provider } });
}

export async function getDecryptedKey(provider: Provider): Promise<string | null> {
  const cred = await getCredential(provider);
  if (!cred) return null;
  return decrypt(cred.encryptedApiKey);
}
