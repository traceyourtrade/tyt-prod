import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    // debug logging to help trace why redirects may not happen
    console.log("Middleware check - pathname:", req.nextUrl.pathname);
  // accept either the new httpOnly `authToken` cookie
  const authToken = req.cookies.get("authToken")?.value;
  const token = authToken 
  console.log("Middleware check - authToken present:", !!authToken);
  // also list all cookie keys for visibility
  try {
    const cookieKeys = Array.from(req.cookies.getAll().map(c=>c.name));
    console.log("Middleware check - cookies:", cookieKeys);
  } catch (e) {
    console.log("Middleware check - error reading cookies", e);
  }
  // include both the intended path and the existing misspelled folder name
  const protectedRoutes = ["/dashboard", "/dashbaord", "/profile", "/settings", "/reports"];

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // temporarily match all routes to validate middleware invocation
    "/:path*",
  ],
};
