import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_EXPIRES_IN_MS,
} from "@/lib/auth-server";

// firebase-admin requires the Node runtime — it cannot run on Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchanges a Firebase ID token for a verified, httpOnly session cookie.
 * The ID token is checked by the Admin SDK, so the resulting cookie cannot be
 * forged the way the old client-written `uid` cookie could.
 */
export async function POST(request: Request) {
  let idToken: unknown;

  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();

    // Verify before minting so a garbage token never becomes a session.
    await adminAuth.verifyIdToken(idToken, true);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session] Failed to create session cookie:", error);
    return NextResponse.json(
      { error: "Could not create session." },
      { status: 401 },
    );
  }
}

/**
 * Clears the session cookie on sign-out.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
