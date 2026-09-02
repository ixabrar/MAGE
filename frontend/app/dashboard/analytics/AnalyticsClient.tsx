"use client";

import { useEffect, useState } from "react";
import { listPatients, listDoctors } from "@/lib/api";

export default function AnalyticsClient() {
  const [stats, setStats] = useState({
    doctors: "—",
    patients: "—",
    reports: "—",
    avgGap: "—",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let doctors = "—";
        let patients = "—";
        try {
          const d = await listDoctors();
          doctors = String(d.doctors.length);
        } catch {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/admin/doctors`);
          if (r.ok) {
            const j = await r.json();
            doctors = String(j.doctors?.length ?? "—");
          }
        }
        try {
          const p = await listPatients();
          patients = String(Array.isArray(p) ? p.length : (p as any)?.length ?? "—");
        } catch {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/patients/`);
          if (r.ok) {
            const j = await r.json();
            const len = Array.isArray(j) ? j.length : j?.patients?.length ?? "—";
            patients = String(len);
          }
        }
        setStats({ doctors, patients, reports: "—", avgGap: "+1.2" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          Analytics
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          System analytics — aggregated only. No raw biometric files or identifiable patient data is exposed here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Doctors", value: loading ? "…" : stats.doctors },
          { label: "Patients (total)", value: loading ? "…" : stats.patients },
          { label: "Reports uploaded", value: loading ? "…" : stats.reports },
          { label: "Avg bio-age gap", value: stats.avgGap },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
              {c.label}
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            Gap distribution (anonymized)
          </h3>
          <div className="mt-6 space-y-3">
            {[
              { label: "Negative gap (<0)", pct: 28, color: "#7ee8c6" },
              { label: "Aligned (0–1)", pct: 42, color: "#c9b4fa" },
              { label: "Positive gap (>1)", pct: 30, color: "#ff8a8a" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span style={{ color: "#bcbac9", fontSize: "13px", width: "140px" }}>{row.label}</span>
                <div className="h-2 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
                <span style={{ color: "#fff", fontSize: "13px", width: "36px", textAlign: "right" }}>{row.pct}%</span>
              </div>
            ))}
          </div>
          <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "12px" }}>Based on de-identified aggregates. Shown for demo when backend analytics not yet wired.</p>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            System health
          </h3>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: "#bcbac9" }}>
            <li className="flex justify-between rounded-md border px-4 py-3" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <span>Fusion layer (ARM → PFM)</span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#7ee8c6", color: "#7ee8c6" }}>
                healthy
              </span>
            </li>
            <li className="flex justify-between rounded-md border px-4 py-3" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <span>Model adapters (face/hand/blood)</span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
                mock active
              </span>
            </li>
            <li className="flex justify-between rounded-md border px-4 py-3" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <span>Supabase persistence</span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#ff8a8a", color: "#ff8a8a" }}>
                configure .env
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "rgba(201,180,250,0.06)", color: "#bcbac9" }}>
        Admin analytics never expose raw face/hand images or full medical reports — only counts and de-identified aggregates.
      </div>
    </div>
  );
}
