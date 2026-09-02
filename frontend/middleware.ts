import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// TEMP DEV BYPASS — AUTH DISABLED FOR DEVELOPMENT
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const sessionUser = (req.auth as any)?.user;
  const role: string | undefined = sessionUser?.role || (req.auth as any)?.role;
  const pathname = req.nextUrl.pathname;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAssessment = pathname.startsWith("/assessment");
  const isOnHistory = pathname.startsWith("/history");
  const isOnPrivacy = pathname.startsWith("/privacy");
  const isOnAuth = pathname.startsWith("/auth") || pathname.startsWith("/login");

  const isDoctorRole = role === "doctor" || role === "clinician";
  const isAdminRole = role === "admin" || role === "system_admin" || role === "organization_admin";
  const isUserRole = !isDoctorRole && !isAdminRole && isLoggedIn; // general user with login shouldn't have dashboard

  if (DEV_BYPASS) {
    if ((isOnDashboard || isOnAssessment || isOnHistory || isOnPrivacy) && !isLoggedIn) {
      return NextResponse.next();
    }
    if (isOnAuth && isLoggedIn) {
      // role-aware redirect for dev bypass
      if (isDoctorRole) return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
      if (isAdminRole) return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Public routes: landing, assessment, fusion, terms, privacy are allowed without login
  // Only dashboard requires auth
  if (isOnDashboard) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
    }
    // User (general) has no dashboard — send to landing
    if (isUserRole) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    const isDoctorPath = pathname.startsWith("/dashboard/patients") || pathname.startsWith("/dashboard/assessments");
    const isAdminPath =
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/organizations") ||
      pathname.startsWith("/dashboard/organization") ||
      pathname.startsWith("/dashboard/audit") ||
      pathname.startsWith("/dashboard/models") ||
      pathname.startsWith("/dashboard/analytics");
    if (isDoctorPath && isAdminRole && !isDoctorRole) {
      return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
    }
    if (isAdminPath && isDoctorRole && !isAdminRole) {
      return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
    }
  }

  if ((isOnAuth || pathname === "/login") && isLoggedIn) {
    if (isDoctorRole) return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
    if (isAdminRole) return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
    // general user logged in unexpectedly — send to home
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
