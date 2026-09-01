import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// TEMP DEV BYPASS — AUTH DISABLED FOR DEVELOPMENT
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAssessment = req.nextUrl.pathname.startsWith("/assessment");
  const isOnHistory = req.nextUrl.pathname.startsWith("/history");
  const isOnPrivacy = req.nextUrl.pathname.startsWith("/privacy");
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth") || req.nextUrl.pathname.startsWith("/login");

  if (DEV_BYPASS) {
    if ((isOnDashboard || isOnAssessment || isOnHistory || isOnPrivacy) && !isLoggedIn) {
      return NextResponse.next();
    }

    if ((isOnAuth) && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    return NextResponse.next();
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if ((isOnAuth || req.nextUrl.pathname === "/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
