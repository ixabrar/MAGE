"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAppShell } from "@/context/AppShellContext";

const ICONS: Record<string, string> = {
  "/dashboard": "◧",
  "/dashboard/patients": "👥",
  "/dashboard/assessments": "◈",
  "/dashboard/history": "▭",
  "/dashboard/users": "👥",
  "/dashboard/organizations": "◧",
  "/dashboard/organization": "◧",
  "/dashboard/models": "◎",
  "/dashboard/audit": "≡",
  "/dashboard/analytics": "▭",
  "/dashboard/datasets": "▭",
  "/dashboard/experiments": "⚗",
};

export function DashboardShell({ user, children }: { user: { id?: string; name?: string; email: string; role?: string }; children: React.ReactNode }) {
  const { navigation, role } = useAppShell();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try { localStorage.removeItem("mage_access_token"); localStorage.removeItem("mage_refresh_token"); localStorage.removeItem("mage_user"); } catch {}
    await signOut({ redirect: false });
    window.location.replace("/auth/signin");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070709] text-white" suppressHydrationWarning>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-[#0a0a0c] px-4 sm:px-6 lg:hidden" style={{ borderColor: "#1e1c2a" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border p-2"
            style={{ borderColor: "#1e1c2a", background: "rgba(255,255,255,0.04)", color: "#bcbac9" }}
            aria-label="Toggle menu"
          >
            <span className="block h-0.5 w-4 bg-white" style={{ boxShadow: "0 6px 0 white, 0 -6px 0 white" }} />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>M</span>
          <span style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.5px" }}>MAGE</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: "#c9b4fa", borderColor: "rgba(201,180,250,0.25)", background: "rgba(201,180,250,0.08)" }}>{role}</span>
        </div>
        <button onClick={handleSignOut} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "#1e1c2a", color: "#bcbac9" }}>Sign out</button>
      </div>

      <div className="flex h-screen w-full overflow-hidden pt-14 lg:pt-0">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-[#0a0a0c] transition-transform duration-200 lg:static lg:translate-x-0 lg:shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{ borderColor: "#1e1c2a" }}
        >
          <div className="flex h-14 items-center gap-3 border-b px-5" style={{ borderColor: "#1e1c2a" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>M</span>
            <div>
              <p className="text-sm font-bold leading-none" style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", letterSpacing: "0.5px" }}>MAGE</p>
              <p className="text-xs capitalize" style={{ color: "#5a5772" }}>{role} • {role === "doctor" || role === "clinician" ? "Patients" : role === "system_admin" || role === "admin" ? "System" : "Portal"}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" style={{ scrollbarWidth: "thin" }}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: "#5a5772" }}>Menu</p>
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: active ? "#c9b4fa" : "transparent",
                      color: active ? "#1b1938" : "#bcbac9",
                      fontWeight: active ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs" style={{ background: active ? "rgba(27,25,56,0.12)" : "rgba(201,180,250,0.12)", color: active ? "#1b1938" : "#c9b4fa" }}>
                      {ICONS[item.href] || "•"}
                    </span>
                    {item.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: "#1b1938" }} aria-hidden="true" />}
                  </a>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border p-3" style={{ background: "#0e0c1f", borderColor: "#1e1c2a" }}>
              <p className="text-xs font-semibold" style={{ color: "#c9b4fa" }}>{role === "doctor" ? "Doctor tip" : role === "system_admin" || role === "admin" ? "Admin tip" : "Tip"}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "#5a5772" }}>
                {role === "doctor" ? "Add a patient, upload report, get SHAP gap & PDF." : role === "system_admin" || role === "admin" ? "You see counts, not raw biometrics." : "Use the sidebar to navigate."}
              </p>
            </div>
          </nav>

          <div className="border-t p-3" style={{ borderColor: "#1e1c2a", background: "rgba(14,12,31,0.6)" }}>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>
                {(user.name || user.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: "#fff" }}>{user.name || "User"}</p>
                <p className="truncate text-xs" style={{ color: "#5a5772" }}>{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <a href="/" className="flex-1 rounded-full border py-1.5 text-center text-xs font-semibold" style={{ borderColor: "#1e1c2a", color: "#bcbac9" }}>Home</a>
              <button onClick={handleSignOut} className="flex-1 rounded-full py-1.5 text-center text-xs font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>Sign out</button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

        {/* Main */}
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="hidden h-14 shrink-0 items-center justify-between border-b bg-[#0a0a0c] px-6 lg:flex" style={{ borderColor: "#1e1c2a" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: "#5a5772" }}>{role} dashboard</p>
              <p className="text-sm font-medium" style={{ color: "#fff" }}>{role === "doctor" ? "Patient care & bio-age" : role === "system_admin" || role === "admin" ? "System overview" : "Overview"}</p>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#5a5772" }}>
              <span className="hidden sm:inline">Need help?</span>
              <a href="/assessment" className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "#1e1c2a", color: "#bcbac9" }}>Public check →</a>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto overscroll-contain bg-[#070709] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
