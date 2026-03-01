"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { saveKeyAction, deleteKeyAction, testKeyAction } from "@/app/actions/credentials";

interface Credential {
  provider: string;
  keyHint: string;
  updatedAt: Date;
}

interface Props {
  credentials: Record<string, Credential>;
}

const PROVIDERS = [
  { id: "openai", name: "OpenAI", description: "GPT models and more" },
  { id: "anthropic", name: "Anthropic (Claude)", description: "Claude models" },
  { id: "openrouter", name: "OpenRouter", description: "Multi-provider routing" },
] as const;

type ProviderId = "openai" | "anthropic" | "openrouter";

export function SettingsForm({ credentials }: Props) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});

  function setProviderLoading(provider: string, state: boolean) {
    setLoading((prev) => ({ ...prev, [provider]: state }));
  }

  async function handleSave(provider: ProviderId) {
    const apiKey = keyInputs[provider];
    if (!apiKey?.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setProviderLoading(provider, true);
    const fd = new FormData();
    fd.append("provider", provider);
    fd.append("apiKey", apiKey);
    const result = await saveKeyAction(fd);
    setProviderLoading(provider, false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Key saved successfully");
      setKeyInputs((prev) => ({ ...prev, [provider]: "" }));
      window.location.reload();
    }
  }

  async function handleDelete(provider: ProviderId) {
    if (!confirm("Delete this key?")) return;
    setProviderLoading(`delete_${provider}`, true);
    const result = await deleteKeyAction(provider);
    setProviderLoading(`delete_${provider}`, false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Key deleted");
      window.location.reload();
    }
  }

  async function handleTest(provider: ProviderId) {
    setProviderLoading(`test_${provider}`, true);
    const result = await testKeyAction(provider);
    setProviderLoading(`test_${provider}`, false);
    if (result.ok) {
      toast.success(`${provider}: ${result.message}`);
    } else {
      toast.error(`${provider}: ${result.message}`);
    }
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map((p) => {
        const cred = credentials[p.id];
        return (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </div>
                {cred ? (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Not configured</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cred && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Key hint: ••••{cred.keyHint} · Updated {new Date(cred.updatedAt).toLocaleDateString()}
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`key-${p.id}`} className="sr-only">
                    {p.name} API Key
                  </Label>
                  <Input
                    id={`key-${p.id}`}
                    type="password"
                    placeholder={cred ? "Enter new key to replace" : "Enter API key"}
                    value={keyInputs[p.id] ?? ""}
                    onChange={(e) =>
                      setKeyInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                  />
                </div>
                <Button
                  onClick={() => handleSave(p.id)}
                  disabled={loading[p.id]}
                >
                  {loading[p.id] ? "Saving..." : cred ? "Update" : "Save"}
                </Button>
              </div>
              {cred && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(p.id)}
                    disabled={loading[`test_${p.id}`]}
                  >
                    {loading[`test_${p.id}`] ? "Testing..." : "Test key"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={loading[`delete_${p.id}`]}
                  >
                    {loading[`delete_${p.id}`] ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
