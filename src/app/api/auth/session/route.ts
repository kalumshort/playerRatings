import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_EXPIRY_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_MS / 1000,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session deletion failed:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
