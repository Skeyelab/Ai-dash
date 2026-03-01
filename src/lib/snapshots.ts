import { prisma } from "./prisma";
import type { Provider } from "@prisma/client";
import type { ProviderStats } from "./providers/openai";

export async function saveSnapshot(
  provider: Provider,
  status: "ok" | "error",
  payload?: ProviderStats,
  errorMessage?: string
) {
  return prisma.providerSnapshot.create({
    data: {
      provider,
      status,
      payloadJson: payload ? (payload as unknown as import("@prisma/client").Prisma.JsonObject) : undefined,
      errorMessage: errorMessage ?? null,
    },
  });
}

export async function getLatestSnapshot(provider: Provider) {
  return prisma.providerSnapshot.findFirst({
    where: { provider },
    orderBy: { fetchedAt: "desc" },
  });
}

export async function getRecentSnapshots(limit = 10) {
  return prisma.providerSnapshot.findMany({
    orderBy: { fetchedAt: "desc" },
    take: limit,
  });
}
