import { NextRequest, NextResponse } from "next/server";

function hasAuthSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

export function middleware(request: NextRequest) {
  if (!hasAuthSessionCookie(request)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
