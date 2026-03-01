import { getLatestSnapshot, getRecentSnapshots } from "@/lib/snapshots";
import { getCredential } from "@/lib/credentials";
import { DashboardClient } from "./dashboard-client";

async function getProviderData(provider: "openai" | "anthropic" | "openrouter") {
  const [credential, snapshot] = await Promise.all([
    getCredential(provider),
    getLatestSnapshot(provider),
  ]);
  return { provider, credential, snapshot };
}

export default async function DashboardPage() {
  const [openai, anthropic, openrouter, recentSnapshots] = await Promise.all([
    getProviderData("openai"),
    getProviderData("anthropic"),
    getProviderData("openrouter"),
    getRecentSnapshots(10),
  ]);

  return (
    <DashboardClient
      providers={[openai, anthropic, openrouter]}
      recentSnapshots={recentSnapshots}
    />
  );
}
