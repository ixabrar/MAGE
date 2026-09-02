"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPatients, getPatient, viewHistoryPdf, type Patient } from "@/lib/api";

export default function DoctorHistoryClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await listPatients().catch(async () => {
          return [];
        });
        const arr = Array.isArray(data) ? data : [];
        const enriched: Patient[] = [];
        for (const p of arr.slice(0, 20)) {
          try {
            const detail = await getPatient(p.id);
            enriched.push(detail);
            continue;
          } catch {}
          enriched.push({ ...p, history: [] } as Patient);
        }
        setPatients(enriched);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allRecords = patients.flatMap((p) =>
    (p.history || []).map((h) => ({
      ...h,
      patientName: `${p.first_name} ${p.last_name}`,
      patientId: p.id,
    }))
  ).sort((a, b) => new Date(b.record_date || b.created_at).getTime() - new Date(a.record_date || a.created_at).getTime());

  const filtered =
    filter === "all" ? allRecords : allRecords.filter((r) => (filter === "positive" ? (r.bio_age_gap ?? 0) > 0 : (r.bio_age_gap ?? 0) < 0));

  if (loading) return <p style={{ color: "#bcbac9", fontSize: "14px" }}>Loading history…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          History
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          Aggregated bio-age history across your patients. Tap a record to open the patient’s full trend chart.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "positive", "negative"] as const).map((f) => (
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
        <span style={{ color: "#5a5772", fontSize: "13px", marginLeft: "8px", alignSelf: "center" }}>{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <p style={{ color: "#fff", fontWeight: 600 }}>No history yet</p>
          <p style={{ color: "#5a5772", fontSize: "14px", marginTop: "6px" }}>Patient records will appear here after you save assessments.</p>
          <Link href="/dashboard/patients" className="mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>
            Go to Patients
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Date</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Patient</th>
                <th className="px-6 py-4 font-semibold uppercase" style={{ color: "#c9b4fa" }}>Chronological</th>
                <th className="px-6 py-4 font-semibold uppercase" style={{ color: "#c9b4fa" }}>Bio (Predicted)</th>
                <th className="px-6 py-4 font-semibold uppercase" style={{ color: "#c9b4fa" }}>Bio-Age Gap</th>
                <th className="px-6 py-4 font-semibold uppercase" style={{ color: "#c9b4fa" }}>Action</th>
                <th className="px-6 py-4 font-semibold uppercase" style={{ color: "#c9b4fa" }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{new Date(r.record_date || r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4" style={{ color: "#fff", fontWeight: 600 }}>{r.patientName}</td>
                  <td className="px-6 py-4">{r.chronological_age ?? "—"}</td>
                  <td className="px-6 py-4">{r.predicted_bio_age?.toFixed(1) ?? "—"}</td>
                  <td className="px-6 py-4" style={{ color: (r.bio_age_gap ?? 0) > 0 ? "#ff8a8a" : (r.bio_age_gap ?? 0) < 0 ? "#7ee8c6" : "#bcbac9" }}>
                    {r.bio_age_gap != null ? `${r.bio_age_gap > 0 ? "+" : ""}${r.bio_age_gap.toFixed(1)}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/patients/${r.patientId}`} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>
                      Open
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => viewHistoryPdf(r.id).catch(e => alert(e.message))}
                      className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-white/5" 
                      style={{ borderColor: "#3f3a52", color: "#c9b4fa" }}
                      title="View exact values for this assessment"
                    >
                      View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
