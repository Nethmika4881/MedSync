import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const role_routes: Record<string, string> = {
  Admin: "/admin",
  Doctor: "/doctor",
  Patient: "/patient",
  FrontDesk: "/front-desk",
};

const protected_routes = ["/admin", "/doctor", "/patient", "/front-desk"];

export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.has("clear")) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_id");
    response.cookies.delete("session_role");
    return response;
  }

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
