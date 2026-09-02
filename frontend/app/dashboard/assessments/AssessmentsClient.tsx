"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPatients, type Patient } from "@/lib/api";

export default function AssessmentsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listPatients().catch(async () => {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/patients/`);
          if (!r.ok) return [];
          return r.json();
        });
        setPatients(Array.isArray(data) ? data : []);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          Assessments
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          Start a new bio-age assessment for a patient, or continue a public Face/Hand assessment. Patient-linked assessments store history for trend tracking.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            Public assessment — Face / Hand
          </h3>
          <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>No login needed. Upload Face or Dorsal Hand image → fusion → bio-age estimate. Ideal for quick checks.</p>
          <Link
            href="/assessment"
            className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}
          >
            Start public assessment →
          </Link>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "#c9b4fa", background: "#0e0c1f" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            Patient-linked assessment
          </h3>
          <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "8px" }}>
            Select a patient, upload their medical report, extract features, and generate a full clinical record with gap analysis and your remarks.
          </p>
          <Link
            href="/dashboard/patients"
            className="mt-4 inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}
          >
            Go to Patients →
          </Link>
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Recent patients for assessment
        </h3>
        {loading ? (
          <p style={{ color: "#5a5772", fontSize: "14px", marginTop: "12px" }}>Loading…</p>
        ) : patients.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
            <p style={{ color: "#fff", fontWeight: 600 }}>No patients yet</p>
            <p style={{ color: "#5a5772", fontSize: "14px", marginTop: "6px" }}>Add a patient first, then you can run patient-linked assessments.</p>
            <Link href="/dashboard/patients" className="mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>
              Add patient
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {patients.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/dashboard/patients/${p.id}`} className="flex items-center justify-between rounded-lg border px-4 py-3 hover:border-white transition-colors" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                <span style={{ color: "#fff", fontWeight: 600 }}>
                  {p.first_name} {p.last_name}
                </span>
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
                  Assess →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "rgba(201,180,250,0.06)", color: "#bcbac9" }}>
        All assessments are validated on the backend — file type/size, input schema, and authorization per doctor. Raw biometric files are never exposed via public URLs.
      </div>
    </div>
  );
}
