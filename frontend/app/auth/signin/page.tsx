"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { saveAuth } from "@/lib/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEMO_ACCOUNTS = [
  {
    role: "User",
    label: "👤 Standard User",
    email: "user@example.com",
    password: "password123",
    desc: "Public biological age estimation",
  },
  {
    role: "Doctor",
    label: "🩺 Doctor Portal",
    email: "doctor@mage.health",
    password: "doctor123",
    desc: "Patients & blood biomarker analysis",
  },
  {
    role: "Admin",
    label: "⚡ System Admin",
    email: "admin@mage.health",
    password: "admin123",
    desc: "User management & audit console",
  },
];

function AuthSignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role"); // doctor | admin | null
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup" || urlMode === "login") {
      setMode(urlMode);
    }
  }, [searchParams]);

  const handleSelectDemo = (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    setMode("login");
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveDemo(demo.role);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const signupData = await signupRes.json().catch(() => ({}));
        if (!signupRes.ok) {
          setError(signupData.error || "Signup failed. Please try a different email.");
          setLoading(false);
          return;
        }
      }

      // 1) Attempt backend login for tokens & role
      let backendRole: string | null = null;
      try {
        const backendRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
        }
      } catch {
        // Fallback to NextAuth session
      }

      // 2) Establish NextAuth session
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.");
        setLoading(false);
        return;
      }

      // 3) Role-aware automatic routing
      let role = backendRole;
      if (!role) {
        try {
          const sessRes = await fetch("/api/auth/session");
          if (sessRes.ok) {
            const sess = await sessRes.json();
            role = sess?.user?.role || (sess as any)?.role || null;
          }
        } catch {}
      }

      role = role || (email.includes("doctor") ? "doctor" : email.includes("admin") ? "system_admin" : "user");

      if (role === "doctor" || role === "clinician") {
        window.location.href = "/dashboard/patients";
      } else if (role === "admin" || role === "system_admin" || role === "organization_admin") {
        window.location.href = "/dashboard/users";
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#c9b4fa]/30" suppressHydrationWarning>
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9b4fa]/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#7b61ff]/8 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold uppercase tracking-[1.8px] text-[#bcbac9] transition-colors hover:border-white hover:text-white"
            style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
          >
            ← MAGE
          </a>
          <a
            href="/assessment"
            className="text-xs font-medium text-[#bcbac9] hover:text-white transition-colors"
          >
            Try Assessment Without Login →
          </a>
        </nav>

        {/* Auth Card Container */}
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <div className="overflow-hidden rounded-2xl border border-[#3f3a52] bg-[#0e0c1f]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            
            {/* Header / Title */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-[#c9b4fa]/15 border border-[#c9b4fa]/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[1.5px] text-[#c9b4fa]">
                MAGE Authentication
              </span>
              <h1
                className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif" }}
              >
                {mode === "login" ? "Welcome Back" : "Create an Account"}
              </h1>
              <p className="mt-1 text-xs text-[#bcbac9]">
                {mode === "login"
                  ? "Sign in to access your patient reports or biological assessments."
                  : "Register for full biological age tracking & clinical analysis."}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-6 grid grid-cols-2 rounded-xl border border-[#3f3a52] bg-black/50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`rounded-lg py-2 transition-all duration-150 ${
                  mode === "login"
                    ? "bg-[#c9b4fa] text-[#1b1938] shadow-sm font-bold"
                    : "text-[#bcbac9] hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`rounded-lg py-2 transition-all duration-150 ${
                  mode === "signup"
                    ? "bg-[#c9b4fa] text-[#1b1938] shadow-sm font-bold"
                    : "text-[#bcbac9] hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Quick One-Click Demo Toolbar */}
            {mode === "login" && (
              <div className="mt-5 rounded-xl border border-white/5 bg-black/40 p-3">
                <div className="flex items-center justify-between text-[11px] text-[#bcbac9] mb-2">
                  <span className="font-semibold text-[#c9b4fa]">⚡ Quick Demo Fill:</span>
                  {activeDemo && <span className="text-[10px] text-emerald-400 font-bold">✓ {activeDemo} Filled</span>}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_ACCOUNTS.map((demo) => (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleSelectDemo(demo)}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all ${
                        activeDemo === demo.role
                          ? "border-[#c9b4fa] bg-[#c9b4fa]/20 text-white"
                          : "border-white/10 bg-white/4 text-[#bcbac9] hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9b4fa]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Alex Morgan"
                    className="mt-1.5 w-full rounded-xl border border-[#3f3a52] bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-[#5a5772] focus:border-[#c9b4fa] focus:outline-none focus:ring-1 focus:ring-[#c9b4fa]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9b4fa]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[#3f3a52] bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-[#5a5772] focus:border-[#c9b4fa] focus:outline-none focus:ring-1 focus:ring-[#c9b4fa]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9b4fa]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#bcbac9] hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-[#3f3a52] bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-[#5a5772] focus:border-[#c9b4fa] focus:outline-none focus:ring-1 focus:ring-[#c9b4fa]"
                />
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 text-center text-xs text-red-300"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#c9b4fa] px-6 py-3 text-sm font-bold text-[#1b1938] shadow-[0_0_20px_rgba(201,180,250,0.25)] transition-all hover:bg-[#d4c2fb] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Authenticating…" : mode === "login" ? "Sign In →" : "Create Account →"}
              </button>
            </form>

            {/* Bottom Footer Note */}
            <p className="mt-6 text-center text-xs text-[#5a5772]">
              Protected by MAGE security. See{" "}
              <a href="/terms" className="text-[#bcbac9] underline hover:text-white">
                Terms &amp; Privacy
              </a>
              .
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm text-[#bcbac9]">
          Loading MAGE Authentication…
        </div>
      }
    >
      <AuthSignInInner />
    </Suspense>
  );
}
