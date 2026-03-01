import { prisma } from "./prisma";
import type { Provider } from "@prisma/client";
import type { ProviderStats } from "./providers/openai";

const MAX_SNAPSHOTS_PER_PROVIDER = 100;

export async function saveSnapshot(
  provider: Provider,
  status: "ok" | "error",
  payload?: ProviderStats,
  errorMessage?: string
) {
  const snapshot = await prisma.providerSnapshot.create({
    data: {
      provider,
      status,
      payloadJson: payload ? (payload as unknown as import("@prisma/client").Prisma.JsonObject) : undefined,
      errorMessage: errorMessage ?? null,
    },
  });

  // Prune old snapshots, keeping only the most recent MAX_SNAPSHOTS_PER_PROVIDER per provider
  const oldest = await prisma.providerSnapshot.findMany({
    where: { provider },
    orderBy: { fetchedAt: "desc" },
    skip: MAX_SNAPSHOTS_PER_PROVIDER,
    select: { id: true },
  });
  if (oldest.length > 0) {
    await prisma.providerSnapshot.deleteMany({
      where: { id: { in: oldest.map((s: { id: string }) => s.id) } },
    });
  }

  return snapshot;
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
