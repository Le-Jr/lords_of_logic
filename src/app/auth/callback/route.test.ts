import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "0f8c2a5e-1b3d-4c6e-9a7f-123456789abc";
const SESSION_COOKIE = "sb-127-auth-token";
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

let exchangeError: { message: string } | null = null;
let profileNickname = "linus";

vi.mock("@/lib/supabase/server", () => ({
  createRouteClient: () => {
    // What @supabase/ssr writes after exchangeCodeForSession.
    const response = NextResponse.next();
    response.cookies.set(SESSION_COOKIE, "session-value", {
      path: "/",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });

    const supabase = {
      auth: {
        exchangeCodeForSession: async () => ({ error: exchangeError }),
        getClaims: async () => ({ data: { claims: { sub: USER_ID } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { nickname: profileNickname } }),
          }),
        }),
      }),
    };

    return { supabase, response };
  },
}));

const { GET } = await import("./route");

const callback = (query: string) =>
  GET(new NextRequest(`http://localhost:3000/auth/callback${query}`));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeError = null;
    profileNickname = "linus";
  });

  it("sends first-time users (placeholder nickname) to onboarding", async () => {
    profileNickname = `Player_${USER_ID.slice(0, 12)}`;
    const res = await callback("?code=abc");
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/auth/nickname",
    );
  });

  it("sends returning users to `next`", async () => {
    const res = await callback("?code=abc&next=/play");
    expect(res.headers.get("location")).toBe("http://localhost:3000/play");
  });

  it("ignores an off-site `next`", async () => {
    const res = await callback("?code=abc&next=https://evil.test");
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("stays on the host the user signed in from (127.0.0.1, site_url)", async () => {
    // Session cookies are set for this host; redirecting to `localhost`
    // would land the user on a host where they have no session.
    const res = await GET(
      new NextRequest("http://127.0.0.1:3000/auth/callback?code=abc&next=/play", {
        headers: { host: "127.0.0.1:3000" },
      }),
    );
    expect(res.headers.get("location")).toBe("http://127.0.0.1:3000/play");
  });

  it("redirects to /login on a failed code exchange", async () => {
    exchangeError = { message: "bad code" };
    const res = await callback("?code=abc");
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-code",
    );
  });

  it("redirects to /login without a code", async () => {
    const res = await callback("");
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-code",
    );
  });

  it("forwards the session cookie with its options (persists across browser restarts)", async () => {
    const res = await callback("?code=abc");
    const cookie = res.cookies.get(SESSION_COOKIE);
    expect(cookie?.value).toBe("session-value");
    expect(cookie?.maxAge).toBe(COOKIE_MAX_AGE);
    expect(cookie?.sameSite).toBe("lax");
  });
});
