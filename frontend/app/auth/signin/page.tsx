"use client";

import { useState } from "react";

export default function AuthSignInPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
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

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        redirect: "follow",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Sign in failed.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
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
              {mode === "login" ? "Sign in to MAGE" : "Create a MAGE account"}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#bcbac9",
              }}
            >
              {mode === "login"
                ? "Use your Google account or email to access assessments, history, and privacy controls."
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
                  minLength={6}
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
