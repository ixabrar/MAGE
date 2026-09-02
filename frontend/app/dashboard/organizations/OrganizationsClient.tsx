"use client";

import { useEffect, useState } from "react";
import { listDoctors } from "@/lib/api";

export default function OrganizationsClient() {
  const [stats, setStats] = useState({ doctors: "—", patients: "—" });

  useEffect(() => {
    (async () => {
      try {
        const d = await listDoctors().catch(async () => {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/admin/doctors`);
          if (!r.ok) return { doctors: [] };
          return r.json();
        });
        setStats((s) => ({ ...s, doctors: String(d.doctors?.length ?? "—") }));
      } catch {}
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/patients/`);
        if (r.ok) {
          const j = await r.json();
          const len = Array.isArray(j) ? j.length : j?.length ?? "—";
          setStats((s) => ({ ...s, patients: String(len) }));
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          Organizations
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          System organization overview — platform-level settings without exposing patient biometrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Primary org</p>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>MAGE Health</p>
          <p style={{ color: "#5a5772", fontSize: "13px", marginTop: "4px" }}>{stats.doctors} doctors · {stats.patients} patients</p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Data residency</p>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>India · Encrypted</p>
          <p style={{ color: "#5a5772", fontSize: "13px", marginTop: "4px" }}>Reports stored separate from identity</p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Compliance</p>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>RBAC enforced</p>
          <p style={{ color: "#5a5772", fontSize: "13px", marginTop: "4px" }}>Doctor vs Admin roles</p>
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Uploaded records — system overview (anonymized)
        </h3>
        <p style={{ color: "#5a5772", fontSize: "13px", marginTop: "6px" }}>Admin sees counts and types only — no file content.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Type</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Count</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Last 7 days</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Validation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "Face images", count: "124", week: "18", validation: "mime + size" },
                { type: "Hand images", count: "98", week: "12", validation: "mime + size" },
                { type: "Blood PDFs", count: "76", week: "9", validation: "pdf/image + 10MB" },
                { type: "Fusion reports", count: "76", week: "9", validation: "anonymized" },
              ].map((r) => (
                <tr key={r.type} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4">{r.type}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{r.count}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{r.week}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
                      {r.validation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "rgba(201,180,250,0.06)", color: "#bcbac9" }}>
        Tell your backend friend: `GET /api/admin/organizations` and `GET /api/admin/records` can replace mock counts — keep patient files out of this view.
      </div>
    </div>
  );
}
