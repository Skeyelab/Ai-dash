"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Nav() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="border-b bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900 dark:text-white">AI Key Dashboard</span>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className={cn(
                "text-sm px-3 py-1.5 rounded-md transition-colors",
                pathname === "/dashboard"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className={cn(
                "text-sm px-3 py-1.5 rounded-md transition-colors",
                pathname === "/settings"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Settings
            </Link>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
