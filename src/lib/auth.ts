import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "ai_dash_session";
const SESSION_VALUE = "authenticated";

export function getAuthCredentials() {
  return {
    username: process.env.BASIC_AUTH_USER ?? "admin",
    password: process.env.BASIC_AUTH_PASS ?? "changeme",
  };
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function requireAuth() {
  const authenticated = await getSession();
  if (!authenticated) {
    redirect("/login");
  }
}

export async function setSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
