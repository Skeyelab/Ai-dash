"use server";

import { redirect } from "next/navigation";
import { getAuthCredentials, setSession, clearSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const creds = getAuthCredentials();
  if (username === creds.username && password === creds.password) {
    await setSession();
    redirect("/dashboard");
  }

  return { error: "Invalid username or password" };
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
