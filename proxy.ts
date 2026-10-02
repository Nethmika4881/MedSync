import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCurrentUser } from "./lib/actions/getcurrentuser";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import path from "path";

const role_routes: Record<string, string> = {
  Admin: "/admin",
  Doctor: "/doctor",
  Patient: "/patient",
  FrontDesk: "/front-desk",
};

const protected_routes = ["/admin", "/doctor", "/patient", "/front-desk"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protected_routes.some((x) => pathname.startsWith(x));
  if (!isProtected) return NextResponse.next();

  const sessionID = request.cookies.get("session_id")?.value;

  if (!sessionID) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = request.cookies.get("session_role")?.value;

  if (role && role_routes[role]) {
    const allowedRoute = role_routes[role];
    if (!pathname.startsWith(allowedRoute)) {
      const dashboardURL = new URL(`${allowedRoute}/dashboard`, request.url);
      return NextResponse.redirect(dashboardURL);
    }
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/front-desk/:path*",
  ],
};
