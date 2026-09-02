"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { saveAuth } from "@/lib/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function AuthSignInInner() {
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role"); // doctor | admin | null
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim().toLowerCase();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      if (mode === "signup") {
        const name = (form.elements.namedItem("name") as HTMLInputElement).value;
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          setError(signupData.error ?? "Signup failed.");
          setLoading(false);
          return;
        }
      }

      // 1) Try backend login first to obtain role + tokens (for API calls)
      let backendRole: string | null = null;
      try {
        const backendRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          if (data?.access_token && data?.user) {
            saveAuth(data.access_token, data.refresh_token || "", {
              id: String(data.user.id),
              email: String(data.user.email),
              full_name: String(data.user.full_name || data.user.email),
              role: String(data.user.role || "user"),
            });
            backendRole = String(data.user.role || "user");
          }
        } else if (mode === "login") {
          // For login, surface backend error if backend reachable
          const j = await backendRes.json().catch(() => ({}));
          if (j?.detail) {
            // don't block next-auth fallback, but capture
            // will try next-auth next
          }
        }
      } catch {
        // backend unavailable — continue to next-auth fallback
      }

      // 2) Establish NextAuth session (authorize will re-hit backend if available)
      const res = await signIn("credentials", { email, password, redirect: false });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // 3) Role-aware redirect — prefer backendRole, fallback to session role (local dev doctors/admins)
      let role = backendRole;
      if (!role) {
        try {
          const sessRes = await fetch("/api/auth/session");
          if (sessRes.ok) {
            const sess = await sessRes.json();
            role = sess?.user?.role || (sess as any)?.role || null;
          }
        } catch { }
      }
      role = role || "user";
      // Enforce requested role if ?role=doctor|admin was in URL
      if (requestedRole === "doctor" && role !== "doctor" && role !== "clinician") {
        setError(`This login is for doctors. Your account role is "${role}". Try doctor@mage.health / doctor123`);
        // sign out the mismatched session so user can retry
        try { await fetch("/api/auth/signout", { method: "POST" }); } catch { }
        try { localStorage.removeItem("mage_access_token"); localStorage.removeItem("mage_user"); } catch { }
        setLoading(false);
        return;
      }
      if (requestedRole === "admin" && role !== "admin" && role !== "system_admin" && role !== "organization_admin") {
        setError(`This login is for admins. Your account role is "${role}". Try admin@mage.health / admin123`);
        try { await fetch("/api/auth/signout", { method: "POST" }); } catch { }
        try { localStorage.removeItem("mage_access_token"); localStorage.removeItem("mage_user"); } catch { }
        setLoading(false);
        return;
      }
      if (role === "doctor" || role === "clinician") {
        window.location.href = "/dashboard/patients";
      } else if (role === "admin" || role === "system_admin" || role === "organization_admin") {
        window.location.href = "/dashboard/users";
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="fixed inset-0 z-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" aria-hidden="true" />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#ffffff",
              }}
            >
              {requestedRole === "doctor"
                ? mode === "login" ? "Doctor Sign in" : "Create Doctor Account"
                : requestedRole === "admin"
                  ? mode === "login" ? "Admin Sign in" : "Create Admin Account"
                  : mode === "login" ? "Sign in to MAGE" : "Create a MAGE account"}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#bcbac9",
              }}
            >
              {requestedRole === "doctor"
                ? "Doctor portal — use your doctor credentials. You’ll be routed to Patients."
                : requestedRole === "admin"
                  ? "Admin console — use your admin credentials. You’ll be routed to Users & System."
                  : mode === "login"
                    ? "Role-based access: doctors and admins use the same login — you will be routed by role."
                    : "Sign up with email to create a new MAGE account."}
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="/api/auth/signin/google"
              className="flex items-center justify-center gap-3 rounded-full border border-white/35 px-6 py-3 text-base font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "0px",
              }}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5" style={{ color: "#ffffff" }}>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </a>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "12px",
                  color: "#bcbac9",
                }}
              >
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div>
                  <label
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "12px",
                      letterSpacing: "1.8px",
                      textTransform: "uppercase",
                      color: "#c9b4fa",
                    }}
                  >
                    Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="mt-2 w-full rounded-md border bg-black px-4 py-3 text-white outline-none"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "16px",
                      borderColor: "#3f3a52",
                      color: "#ffffff",
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "12px",
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: "#c9b4fa",
                  }}
                >
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-md border bg-black px-4 py-3 text-white outline-none"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "16px",
                    borderColor: "#3f3a52",
                    color: "#ffffff",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "12px",
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: "#c9b4fa",
                  }}
                >
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  className="mt-2 w-full rounded-md border bg-black px-4 py-3 text-white outline-none"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "16px",
                    borderColor: "#3f3a52",
                    color: "#ffffff",
                  }}
                />
              </div>

              {error && (
                <p
                  className="text-center"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "13px",
                    color: "#ff8a8a",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-colors duration-150 hover:bg-white/90 disabled:opacity-60"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: 1.0,
                  letterSpacing: "0px",
                }}
              >
                {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>

          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "13px",
              color: "#bcbac9",
            }}
          >
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="text-white underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className="text-white underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "12px",
              color: "#bcbac9",
            }}
          >
            By continuing, you agree to MAGE’s <a href="/terms" className="text-white underline">Terms and Conditions</a>.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white" style={{ color: "#bcbac9" }}>Loading…</div>}>
      <AuthSignInInner />
    </Suspense>
  );
}
