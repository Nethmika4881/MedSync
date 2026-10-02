import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const role_routes: Record<string, string> = {
  Admin: "/admin",
  Doctor: "/doctor",
  Patient: "/patient",
  FrontDesk: "/front-desk",
};

const protected_routes = ["/admin", "/doctor", "/patient", "/front-desk"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionID = request.cookies.get("session_id")?.value;
  const role = request.cookies.get("session_role")?.value;

  if (sessionID && role && role_routes[role]) {
    if (pathname === "/login" || pathname === "/") {
      return NextResponse.redirect(
        new URL(`${role_routes[role]}/dashboard`, request.url),
      );
    }
  }

  const isProtected = protected_routes.some((x) => pathname.startsWith(x));
  if (!isProtected) return NextResponse.next();

  if (!sessionID) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role && role_routes[role]) {
    const allowedRoute = role_routes[role];
    if (!pathname.startsWith(allowedRoute)) {
      const dashboardURL = new URL(`${allowedRoute}/dashboard`, request.url);
      return NextResponse.redirect(dashboardURL);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/front-desk/:path*",
  ],
};
