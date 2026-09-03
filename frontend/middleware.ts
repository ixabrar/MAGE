import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const sessionUser = (req.auth as any)?.user;
  const role: string = sessionUser?.role || (req.auth as any)?.role || "user";
  const pathname = req.nextUrl.pathname;

  const isDoctorRole = role === "doctor" || role === "clinician";
  const isAdminRole = role === "admin" || role === "system_admin" || role === "organization_admin";

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAuth = pathname.startsWith("/auth") || pathname.startsWith("/login");

  // 1. Strict Dashboard Protection
  if (isOnDashboard) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.nextUrl);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Standard public users have no dashboard access — send to landing
    if (!isDoctorRole && !isAdminRole) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // Route root /dashboard to designated role portal
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      if (isDoctorRole) {
        return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
      }
      if (isAdminRole) {
        return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
      }
    }

    // Role-based boundary enforcement
    const isDoctorOnlyPath =
      pathname.startsWith("/dashboard/patients") ||
      pathname.startsWith("/dashboard/assessments") ||
      pathname.startsWith("/dashboard/history");

    const isAdminOnlyPath =
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/organizations") ||
      pathname.startsWith("/dashboard/organization") ||
      pathname.startsWith("/dashboard/audit") ||
      pathname.startsWith("/dashboard/models") ||
      pathname.startsWith("/dashboard/analytics") ||
      pathname.startsWith("/dashboard/datasets") ||
      pathname.startsWith("/dashboard/experiments");

    // Doctor trying to access Admin pages -> redirect to Doctor portal
    if (isAdminOnlyPath && isDoctorRole && !isAdminRole) {
      return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
    }

    // Admin trying to access Doctor patient records -> redirect to Admin console
    if (isDoctorOnlyPath && isAdminRole && !isDoctorRole) {
      return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
    }
  }

  // 2. Prevent logged-in users from lingering on auth pages
  if (isOnAuth && isLoggedIn) {
    if (isDoctorRole) {
      return NextResponse.redirect(new URL("/dashboard/patients", req.nextUrl));
    }
    if (isAdminRole) {
      return NextResponse.redirect(new URL("/dashboard/users", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
