import { getAllCredentials } from "@/lib/credentials";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const credentials = await getAllCredentials();
  const credMap = Object.fromEntries(credentials.map((c) => [c.provider, c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your AI provider API keys</p>
      </div>
      <SettingsForm credentials={credMap} />
    </div>
  );
}
