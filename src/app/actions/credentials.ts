"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { upsertCredential, deleteCredential, getDecryptedKey } from "@/lib/credentials";
import { saveSnapshot } from "@/lib/snapshots";
import * as openai from "@/lib/providers/openai";
import * as anthropic from "@/lib/providers/anthropic";
import * as openrouter from "@/lib/providers/openrouter";
import type { Provider } from "@prisma/client";

const SaveKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "openrouter"]),
  apiKey: z.string().min(1, "API key is required"),
});

export async function saveKeyAction(formData: FormData) {
  await requireAuth();

  const parsed = SaveKeySchema.safeParse({
    provider: formData.get("provider"),
    apiKey: formData.get("apiKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await upsertCredential(parsed.data.provider as Provider, parsed.data.apiKey);
    return { success: true };
  } catch {
    return { error: "Failed to save key" };
  }
}

export async function deleteKeyAction(provider: Provider) {
  await requireAuth();
  try {
    await deleteCredential(provider);
    return { success: true };
  } catch {
    return { error: "Failed to delete key" };
  }
}

export async function testKeyAction(provider: Provider) {
  await requireAuth();

  const apiKey = await getDecryptedKey(provider);
  if (!apiKey) return { ok: false, message: "No key saved" };

  const providers = { openai, anthropic, openrouter };
  try {
    return await providers[provider].testKey(apiKey);
  } catch {
    return { ok: false, message: "Test failed" };
  }
}

export async function refreshProviderAction(provider: Provider) {
  await requireAuth();

  const apiKey = await getDecryptedKey(provider);
  if (!apiKey) {
    await saveSnapshot(provider, "error", undefined, "No API key configured");
    return { error: "No API key configured" };
  }

  const providers = { openai, anthropic, openrouter };
  try {
    const stats = await providers[provider].fetchStats(apiKey);
    await saveSnapshot(provider, "ok", stats);
    return { success: true, data: stats };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await saveSnapshot(provider, "error", undefined, msg);
    return { error: msg };
  }
}

export async function refreshAllAction() {
  await requireAuth();
  const providers: Provider[] = ["openai", "anthropic", "openrouter"];
  const results = await Promise.allSettled(providers.map(refreshProviderAction));
  return results.map((r, i) => ({
    provider: providers[i],
    ...(r.status === "fulfilled" ? r.value : { error: "Failed" }),
  }));
}
