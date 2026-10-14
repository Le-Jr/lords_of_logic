import { NextRequest, NextResponse } from "next/server";

import { isPlaceholderNickname } from "@/lib/nickname";
import { requestOrigin } from "@/lib/request-origin";
import { createRouteClient } from "@/lib/supabase/server";

// Copies the session cookies, with their options (maxAge, sameSite...), and
// the no-cache headers @supabase/ssr wrote onto the route client's response.
function withSession(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  });
  return target;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = requestOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/")
    ? searchParams.get("next")!
    : "/";

  if (code) {
    const { supabase, response: supabaseResponse } = createRouteClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data } = await supabase.auth.getClaims();

      if (data?.claims.sub) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", data.claims.sub)
          .single();

        if (
          profile &&
          isPlaceholderNickname(profile.nickname, data.claims.sub)
        ) {
          return withSession(
            NextResponse.redirect(`${origin}/auth/nickname`),
            supabaseResponse,
          );
        }
      }

      return withSession(
        NextResponse.redirect(`${origin}${next}`),
        supabaseResponse,
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code`);
}
