import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "./session";

const SESSION_COOKIE = "ai_dash_session";

export function getAuthCredentials() {
  return {
    username: process.env.BASIC_AUTH_USER ?? "admin",
    password: process.env.BASIC_AUTH_PASS ?? "changeme",
  };
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return false;
  return verifySessionToken(value);
}

export async function requireAuth() {
  const authenticated = await getSession();
  if (!authenticated) {
    redirect("/login");
  }
}
