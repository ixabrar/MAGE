"use client";

import { signOut } from "next-auth/react";
import { useAppShell } from "@/context/AppShellContext";
import PortalFieldCollection from "@/components/effects/PortalFieldCollection";

export function DashboardShell({ user, children }: { user: { id?: string; name?: string; email: string; role?: string }; children: React.ReactNode }) {
  const { navigation } = useAppShell();

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="fixed inset-0 z-0">
        <PortalFieldCollection />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" aria-hidden="true" />
      </div>

      <nav
        className="relative z-40 flex h-16 items-center justify-between px-6 sm:px-10"
        style={{
          background: "rgba(0, 0, 0, 0.55)",
          borderBottom: "1px solid #3f3a52",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center">
            <span
              className="text-white"
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontWeight: 700,
                letterSpacing: "1.5px",
              }}
            >
              MAGE
            </span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white/70 transition-colors duration-150 hover:text-white"
                style={{
                  fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                  fontSize: "14px",
                  letterSpacing: "0.5px",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span
            style={{
              fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
              fontSize: "13px",
              color: "#bcbac9",
            }}
          >
            {user.name ?? user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border border-white/35 px-4 py-1 text-white transition-colors duration-150 hover:border-white hover:bg-white/6"
            style={{
              fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
              fontSize: "13px",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="relative z-10 px-6 py-10 sm:px-10 lg:px-16">
        <div className="max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
