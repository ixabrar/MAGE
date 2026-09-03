"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStoredUser } from "@/lib/authStore";
import { listPatients, listDoctors } from "@/lib/api";

const recent = [
  { id: "A-001", date: "2026-08-31", modalities: "Face + Hand", status: "Completed", estimate: "27.4" },
  { id: "A-002", date: "2026-08-30", modalities: "Face + Hand", status: "Processing", estimate: "—" },
  { id: "A-003", date: "2026-08-29", modalities: "Face", status: "Completed", estimate: "29.0" },
];

export default function DashboardIndexClient() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState([
    { label: "Assessments", value: "—" },
    { label: "Patients", value: "—" },
    { label: "Doctors", value: "—" },
    { label: "Data sources", value: "2" },
  ]);

  useEffect(() => {
    const stored = getStoredUser();
    const role = (session?.user as any)?.role || stored?.role || "user";
    // Try to fetch live counts where allowed; fallback keeps "—"
    (async () => {
      try {
        if (role === "doctor" || role === "clinician" || role === "system_admin" || role === "admin") {
          try {
            const patients = await listPatients();
            setStats((s) => s.map((x) => (x.label === "Patients" ? { ...x, value: String((patients as any).length ?? "—") } : x)));
          } catch {
            // try unauthenticated fallback for dev dummy id
            try {
              const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
              const r = await fetch(`${base}/api/patients/`);
              if (r.ok) {
                const j = await r.json();
                const len = Array.isArray(j) ? j.length : j?.length ?? "—";
                setStats((s) => s.map((x) => (x.label === "Patients" ? { ...x, value: String(len) } : x)));
              }
            } catch { }
          }
        }
        if (role === "system_admin" || role === "admin") {
          try {
            const d = await listDoctors();
            setStats((s) => s.map((x) => (x.label === "Doctors" ? { ...x, value: String(d.doctors.length) } : x)));
          } catch {
            const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const r = await fetch(`${base}/api/admin/doctors`);
            if (r.ok) {
              const j = await r.json();
              setStats((s) => s.map((x) => (x.label === "Doctors" ? { ...x, value: String(j.doctors?.length ?? "—") } : x)));
            }
          }
        }
        // assessments: try to infer from local history? keep static for now
        setStats((s) => s.map((x) => (x.label === "Assessments" ? { ...x, value: recent.length.toString() } : x)));
      } catch { }
    })();
  }, []);

  const filtered = filter === "all" ? recent : recent.filter((item) => item.status.toLowerCase() === filter);

  const roleNow = mounted ? ((session?.user as any)?.role || getStoredUser()?.role || "user") : "user";
  const isDoctor = mounted && (roleNow === "doctor" || roleNow === "clinician");
  const isAdmin = mounted && (roleNow === "admin" || roleNow === "system_admin" || roleNow === "organization_admin");

  return (
    <div className="space-y-8">
      <div>
        <h1
          suppressHydrationWarning
          style={{
            fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          {mounted ? (isDoctor ? "Doctor Dashboard" : isAdmin ? "Admin Dashboard" : "Dashboard") : "Dashboard"}
        </h1>
        <p suppressHydrationWarning style={{ color: "#bcbac9", fontSize: "14px", marginTop: "6px" }}>
          {mounted
            ? isDoctor
              ? "Manage patients, review bio-age gaps, upload reports, and track history — isolated to your assigned patients."
              : isAdmin
                ? "System overview — doctors, anonymized patient counts, audit logs, and model registry. No raw biometric data exposed."
                : "Overview"
            : "Overview"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000000" }}>
            <p
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "12px",
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: "#c9b4fa",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#ffffff",
                marginTop: "8px",
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-8" style={{ borderColor: "#3f3a52", background: "#000000" }}>
        <div className="flex flex-wrap items-center gap-3">
          <h2
            style={{
              fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#ffffff",
            }}
          >
            Recent assessments
          </h2>
          <Link href="/dashboard/patients" className="ml-auto text-xs underline" style={{ color: "#c9b4fa" }}>
            Go to patients →
          </Link>
          {["all", "completed", "processing"].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "13px",
                borderColor: filter === option ? "#c9b4fa" : "#3f3a52",
                color: filter === option ? "#ffffff" : "#bcbac9",
                background: filter === option ? "rgba(201,180,250,0.15)" : "transparent",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: "14px", color: "#ffffff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>ID</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Date</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Modalities</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Status</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.id}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.date}</td>
                  <td className="px-6 py-4">{item.modalities}</td>
                  <td className="px-6 py-4">
                    <span
                      className="rounded-full border px-3 py-1"
                      style={{
                        borderColor: item.status === "Completed" ? "#c9b4fa" : "#3f3a52",
                        color: item.status === "Completed" ? "#c9b4fa" : "#bcbac9",
                        fontSize: "12px",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.estimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDoctor && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Quick — Patients</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Add, search, open profile, upload reports & track bio-age gaps.</p>
            <Link href="/dashboard/patients" className="mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>
              Manage patients →
            </Link>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>New assessment</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Public Face/Hand or patient-linked with report + explainability.</p>
            <Link href="/dashboard/assessments" className="mt-4 inline-flex rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
              Assessments →
            </Link>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>History & trends</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Patient history table + gap trend chart (Date | Chrono | Bio | Gap).</p>
            <Link href="/dashboard/history" className="mt-4 inline-flex rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>
              View history →
            </Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Manage doctors</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Create, list, disable doctors. Passwords never stored plain text.</p>
            <Link href="/dashboard/users" className="mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>
              Users & roles →
            </Link>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>System analytics</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Aggregated counts, gap distribution, model health — no raw biometrics.</p>
            <Link href="/dashboard/analytics" className="mt-4 inline-flex rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
              Analytics →
            </Link>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Organizations & audit</h3>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>Organizations overview, uploaded records (counts), audit logs.</p>
            <Link href="/dashboard/audit" className="mt-4 inline-flex rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>
              Audit logs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
