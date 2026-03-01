"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { refreshProviderAction, refreshAllAction } from "@/app/actions/credentials";

type Provider = "openai" | "anthropic" | "openrouter";

interface ProviderData {
  provider: Provider;
  credential: { keyHint: string; updatedAt: Date } | null;
  snapshot: {
    status: "ok" | "error";
    fetchedAt: Date;
    payloadJson: unknown;
    errorMessage: string | null;
  } | null;
}

interface Props {
  providers: ProviderData[];
  recentSnapshots: Array<{
    id: string;
    provider: Provider;
    fetchedAt: Date;
    status: "ok" | "error";
    errorMessage: string | null;
  }>;
}

const PROVIDER_NAMES: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
};

const PROVIDER_COLORS: Record<Provider, string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-orange-500",
  openrouter: "bg-blue-500",
};

function formatAmount(amount: number | null, unit: string | null): string {
  if (amount === null) return "N/A";
  if (unit === "tokens") return `${amount.toLocaleString()} tokens`;
  return `${amount.toLocaleString()} ${unit ?? ""}`.trim();
}

function ProviderCard({
  data,
  onRefresh,
  refreshing,
}: {
  data: ProviderData;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { provider, credential, snapshot } = data;
  const payload = snapshot?.payloadJson as {
    balance?: { amount: number | null; currency: string | null; unit: string | null } | null;
    usage?: { period: string; amount: number | null; unit: string | null } | null;
    raw?: { note?: string };
  } | null;

  const statusVariant = !credential
    ? "secondary"
    : snapshot?.status === "ok"
    ? "default"
    : "destructive";

  const statusLabel = !credential ? "Missing key" : snapshot?.status === "ok" ? "OK" : "Error";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${PROVIDER_COLORS[provider]}`} />
            <CardTitle className="text-lg">{PROVIDER_NAMES[provider]}</CardTitle>
          </div>
          <Badge
            variant={statusVariant as "default" | "secondary" | "destructive"}
            className={snapshot?.status === "ok" ? "bg-green-500" : undefined}
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!credential ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No API key configured.{" "}
            <a href="/settings" className="underline text-blue-500">
              Add one in Settings
            </a>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</p>
                {payload?.balance ? (
                  <p className="text-lg font-semibold">
                    {formatAmount(payload.balance.amount, payload.balance.unit)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Not available</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usage (this month)</p>
                {payload?.usage ? (
                  <p className="text-lg font-semibold">
                    {formatAmount(payload.usage.amount, payload.usage.unit)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Not available</p>
                )}
              </div>
            </div>

            {payload?.raw && typeof payload.raw === "object" && "note" in payload.raw && (
              <p className="text-xs text-gray-400 italic">{(payload.raw as { note: string }).note}</p>
            )}

            {snapshot?.status === "error" && snapshot.errorMessage && (
              <p className="text-sm text-red-500">{snapshot.errorMessage}</p>
            )}

            <div className="text-xs text-gray-400">
              {credential && <>Key: ••••{credential.keyHint}</>}
              {snapshot?.fetchedAt && (
                <> · Last refreshed: {new Date(snapshot.fetchedAt).toLocaleString()}</>
              )}
              {!snapshot && <> · Never refreshed</>}
            </div>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing || !credential}
          className="w-full"
        >
          {refreshing ? "Refreshing..." : "Refresh now"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ providers, recentSnapshots }: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  async function handleRefresh(provider: Provider) {
    setRefreshing((prev) => ({ ...prev, [provider]: true }));
    const result = await refreshProviderAction(provider);
    setRefreshing((prev) => ({ ...prev, [provider]: false }));
    if ("error" in result) {
      toast.error(`${PROVIDER_NAMES[provider]}: ${result.error}`);
    } else {
      toast.success(`${PROVIDER_NAMES[provider]} refreshed`);
    }
    router.refresh();
  }

  async function handleRefreshAll() {
    setRefreshing({ openai: true, anthropic: true, openrouter: true });
    const results = await refreshAllAction();
    setRefreshing({});

    let hasError = false;
    for (const result of results ?? []) {
      const provider = "provider" in result ? (result.provider as Provider) : undefined;
      if ("error" in result && result.error) {
        hasError = true;
        const providerName = provider ? PROVIDER_NAMES[provider] : "Provider";
        toast.error(`${providerName}: ${result.error}`);
      }
    }
    if (!hasError) {
      toast.success("All providers refreshed");
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your AI provider keys and usage</p>
        </div>
        <Button onClick={handleRefreshAll} disabled={Object.values(refreshing).some(Boolean)}>
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => (
          <ProviderCard
            key={p.provider}
            data={p}
            onRefresh={() => handleRefresh(p.provider)}
            refreshing={refreshing[p.provider] ?? false}
          />
        ))}
      </div>

      {recentSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSnapshots.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[s.provider]}`} />
                    <span className="font-medium">{PROVIDER_NAMES[s.provider]}</span>
                    <Badge
                      variant={s.status === "ok" ? "default" : "destructive"}
                      className={s.status === "ok" ? "bg-green-500 text-xs" : "text-xs"}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(s.fetchedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
