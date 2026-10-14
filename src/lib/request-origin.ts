import type { NextRequest } from "next/server";

/**
 * The origin the browser actually used. NextRequest normalizes 127.0.0.1 to
 * `localhost` in `request.url` / `nextUrl`, and those are different cookie
 * hosts: redirecting there after setting the session cookies would land the
 * user on a host where they have no session. Read the Host header instead.
 */
export function requestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return request.nextUrl.origin;
  }
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}
