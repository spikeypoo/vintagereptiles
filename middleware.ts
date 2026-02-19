// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // req.auth contains session info
  if (!req.auth?.user) {
    // Not signed in → redirect to /signin
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // signed in → allow access
  return NextResponse.next();
});

// only run middleware on /panel routes
export const config = {
  matcher: ["/panel/:path*"],
};