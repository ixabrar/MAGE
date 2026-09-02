"use client";

import { useState } from "react";

const mockEvents = [
  { id: "E-001", action: "DOCTOR_LOGIN", actor: "dr.smith@mage.health", role: "doctor", resource: "session", result: "success", timestamp: "2026-09-01T08:10:00Z", detail: "—" },
  { id: "E-002", action: "PATIENT_CREATED", actor: "dr.smith@mage.health", role: "doctor", resource: "patients/9f3b...", result: "success", timestamp: "2026-09-01T08:12:00Z", detail: "patient_id anonymized" },
  { id: "E-003", action: "REPORT_UPLOADED", actor: "dr.smith@mage.health", role: "doctor", resource: "patients/9f3b/reports/1", result: "success", timestamp: "2026-09-01T08:15:00Z", detail: "type: pdf, size: 1.2MB" },
  { id: "E-004", action: "PREDICTION_RUN", actor: "system", role: "system", resource: "patients/9f3b", result: "success", timestamp: "2026-09-01T08:15:30Z", detail: "fused_age: 34.2, gap: +2.1" },
  { id: "E-005", action: "DOCTOR_REMARK_SAVED", actor: "dr.smith@mage.health", role: "doctor", resource: "patients/9f3b/history", result: "success", timestamp: "2026-09-01T08:18:00Z", detail: "history anonymized" },
  { id: "E-006", action: "ADMIN_CREATED_DOCTOR", actor: "admin@example.com", role: "admin", resource: "profiles/abc...", result: "success", timestamp: "2026-09-01T09:00:00Z", detail: "role: doctor" },
  { id: "E-007", action: "ADMIN_DISABLED_DOCTOR", actor: "admin@example.com", role: "admin", resource: "profiles/def...", result: "success", timestamp: "2026-09-01T09:05:00Z", detail: "soft_delete" },
];

export default function AuditClient() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? mockEvents : mockEvents.filter((e) => e.role === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          Audit logs
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          Protected actions — who did what, when. Raw biometric images and full report blobs are <span style={{ color: "#c9b4fa" }}>never</span> stored in logs.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "doctor", "admin", "system"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold capitalize"
            style={{
              borderColor: filter === f ? "#c9b4fa" : "#3f3a52",
              color: filter === f ? "#fff" : "#bcbac9",
              background: filter === f ? "rgba(201,180,250,0.15)" : "transparent",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #3f3a52" }}>
              <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Time</th>
              <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Action</th>
              <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Actor</th>
              <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Role</th>
              <th className="px-6 py-4 text-xs uppercase hidden md:table-cell" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Resource</th>
              <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                <td className="px-6 py-4" style={{ color: "#bcbac9", fontSize: "13px" }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4">{e.action}</td>
                <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{e.actor}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>
                    {e.role}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell" style={{ color: "#5a5772", fontSize: "13px" }}>{e.resource}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "#7ee8c6", color: "#7ee8c6" }}>
                    {e.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "rgba(201,180,250,0.06)", color: "#bcbac9" }}>
        Logs are append-only and admin-viewable. When your friend wires the backend, replace mockEvents with `GET /api/admin/audit` — keep the “no raw biometric” guarantee.
      </div>
    </div>
  );
}
