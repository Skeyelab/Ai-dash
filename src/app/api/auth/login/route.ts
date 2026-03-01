import { NextRequest, NextResponse } from "next/server";
import { getAuthCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const creds = getAuthCredentials();
  if (username === creds.username && password === creds.password) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("ai_dash_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
}
