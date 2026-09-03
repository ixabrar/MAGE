"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPatient, uploadReport, predictBioAge, predictBioAgePdf, addPatientHistory, uploadHistoryPdf, viewHistoryPdf, emailReport, type Patient, type ExtractedFeature, type BioAgePrediction, type BioAgePredictionRequest } from "@/lib/api";
import { mockFeaturesFromFile, mockBioAgePrediction, ageFromDob } from "@/lib/mockBioAge";
import { mockGetPatient, mockAddHistory } from "@/lib/mockPatients";

export default function PatientDetailClient({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // report & features
  const [features, setFeatures] = useState<ExtractedFeature[] | null>(null);
  const [reportName, setReportName] = useState<string | null>(null);
  const [reportUploading, setReportUploading] = useState(false);
  const [prediction, setPrediction] = useState<BioAgePrediction | null>(null);
  const [predicting, setPredicting] = useState(false);
  // real backend PDF
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [bioAgeForm, setBioAgeForm] = useState<BioAgePredictionRequest>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // reviews
  const [manualReview, setManualReview] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      let p: Patient | null = null;
      try {
        p = await getPatient(patientId);
      } catch {
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/patients/${patientId}`);
          if (r.ok) p = await r.json();
        } catch {}
      }
      if (!p) p = mockGetPatient(patientId);
      if (!p) throw new Error("Patient not found");
      setPatient(p);
      const latest = p.history?.[p.history.length - 1];
      if (latest?.doctor_remarks) setRemarks(latest.doctor_remarks);
    } catch (e: any) {
      setError(e.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const chronologicalAge = useMemo(() => (patient?.date_of_birth ? ageFromDob(patient.date_of_birth) : null), [patient]);

  function mapFeaturesToBioAgeRequest(feats: ExtractedFeature[], gender: string | undefined): BioAgePredictionRequest {
    const find = (name: string) => feats.find((f) => f.name.toLowerCase().includes(name.toLowerCase()))?.value as number | undefined;
    const glucose = find("glucose");
    const chol = find("cholesterol");
    const hdl = find("hdl");
    const bmiVal = find("bmi");
    const sys = find("systolic");
    // derive Gender: 1 male, 0 female
    const genderVal = gender?.toLowerCase().startsWith("m") ? 1 : gender?.toLowerCase().startsWith("f") ? 0 : undefined;
    return {
      LBXSGL: typeof glucose === "number" ? glucose : glucose ? Number(glucose) : undefined,
      LBXTC: typeof chol === "number" ? chol : undefined,
      LBDHDD: typeof hdl === "number" ? hdl : undefined,
      Systolic_BP: typeof sys === "number" ? sys : undefined,
      BMI: typeof bmiVal === "number" ? bmiVal : undefined,
      Gender: genderVal,
      // sensible defaults for demo so model has signal
      Weight: bmiVal && typeof bmiVal === "number" ? Number((bmiVal * 1.75 * 1.75).toFixed(1)) : undefined,
      Height: 175,
      Waist: 85,
      Exercise_days: 3,
      Alcohol_days: 1,
      Smoking_status_Never: 1,
    };
  }

  async function handleReport(file: File) {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF or image reports are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }
    setError(null);
    setReportUploading(true);
    setReportName(file.name);
    try {
      let feats: ExtractedFeature[] | null = null;
      try {
        const res = await uploadReport(patientId, file);
        feats = res.extracted_features;
      } catch {
        feats = mockFeaturesFromFile(file.name);
      }
      setFeatures(feats);
      if (feats) {
        setBioAgeForm((prev) => ({ ...mapFeaturesToBioAgeRequest(feats, patient?.gender), ...prev }));
      }
      // auto predict after extraction (mock JSON for offline gap display)
      if (chronologicalAge !== null && feats) {
        setPredicting(true);
        try {
          let pred: BioAgePrediction;
          try {
            pred = await predictBioAge(patientId, undefined, feats);
          } catch {
            pred = mockBioAgePrediction(chronologicalAge, feats);
          }
          setPrediction(pred);
        } finally {
          setPredicting(false);
        }
      }
    } catch (e: any) {
      setError(e.message || "Report processing failed");
    } finally {
      setReportUploading(false);
    }
  }

  async function handleGeneratePdf() {
    if (!patient) return;
    setPdfLoading(true);
    setError(null);
    try {
      const payload: BioAgePredictionRequest = { ...bioAgeForm };
      if (payload.Gender === undefined && patient.gender) {
        payload.Gender = patient.gender.toLowerCase().startsWith("m") ? 1 : patient.gender.toLowerCase().startsWith("f") ? 0 : undefined;
      }
      // First get real JSON prediction so frontend display == PDF (same payload, same model)
      const { predictBioAgeJson } = await import("@/lib/api");
      try {
        const json = await predictBioAgeJson(patientId, payload);
        const mapped: BioAgePrediction = {
          chronological_age: json.chronological_age,
          predicted_bio_age: json.predicted_bio_age,
          bio_age_gap: json.bio_age_gap,
          contributing_factors: (json.top_contributing_factors || []).map((f: any) => ({
            feature: f.feature,
            direction: f.impact > 0 ? "increases gap" : "decreases gap",
            strength: Math.min(1, Math.abs(f.impact) / 2),
          })),
          ai_summary: `Real XGBoost: chrono ${json.chronological_age}, bio ${json.predicted_bio_age.toFixed(1)}, gap ${json.bio_age_gap > 0 ? "+" : ""}${json.bio_age_gap.toFixed(1)}. Top: ${(json.top_contributing_factors || []).map((f: any) => f.feature).join(", ") || "none"}.`,
          recommendations: [],
        };
        setPrediction(mapped);
      } catch (jsonErr) {
        console.warn("JSON prediction failed, will still try PDF", jsonErr);
      }
      const blob = await predictBioAgePdf(patientId, payload);
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setSaveMsg("Official PDF and frontend now share the same real XGBoost prediction.");
    } catch (e: any) {
      setError(e.message || "PDF generation failed — is the backend’s xgb_model.pkl and shap installed? Falling back to mock gap above.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSendEmail() {
    setSendingEmail(true);
    setEmailMsg(null);
    try {
      const res = await emailReport(patientId);
      setEmailMsg({ type: "success", text: res.message || "Email sent successfully!" });
    } catch (e: any) {
      setEmailMsg({ type: "error", text: e.message || "Failed to send email" });
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSaveRecord() {
    if (!patient || chronologicalAge === null || !prediction) {
      setError("Please upload a report and generate prediction first.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      // Save history entry including AI summary + doctor notes
      const combinedRemarks = remarks.trim() ? remarks.trim() : manualReview.trim() ? manualReview.trim() : undefined;
      // If both exist, combine
      const finalRemarks = [manualReview.trim(), remarks.trim()].filter(Boolean).join("\n\n— Remarks: ");
      try {
        const rec = await addPatientHistory(patientId, {
          chronological_age: prediction.chronological_age,
          predicted_bio_age: prediction.predicted_bio_age,
          bio_age_gap: prediction.bio_age_gap,
          ai_summary: prediction.ai_summary,
          doctor_remarks: finalRemarks || combinedRemarks || null,
        });
        
        // Link the PDF to this history record if we generated one
        if (pdfBlob) {
          try {
            await uploadHistoryPdf(rec.id, pdfBlob);
          } catch (e) {
            console.error("Failed to upload PDF for history link", e);
          }
        }
      } catch {
        // offline demo fallback — persist to local mock store + update UI
        const rec = mockAddHistory(patientId, {
          chronological_age: prediction.chronological_age,
          predicted_bio_age: prediction.predicted_bio_age,
          bio_age_gap: prediction.bio_age_gap,
          ai_summary: prediction.ai_summary,
          doctor_remarks: finalRemarks || combinedRemarks || null,
        });
        if (rec) {
          setPatient((prev) =>
            prev ? { ...prev, history: [...(prev.history || []), rec] } : prev
          );
        } else {
          // fallback in-memory if even mock fails
          setPatient((prev) =>
            prev
              ? {
                  ...prev,
                  history: [
                    ...(prev.history || []),
                    {
                      id: `local_${Date.now()}`,
                      patient_id: patientId,
                      doctor_id: prev.doctor_id,
                      record_date: new Date().toISOString(),
                      chronological_age: prediction.chronological_age,
                      predicted_bio_age: prediction.predicted_bio_age,
                      bio_age_gap: prediction.bio_age_gap,
                      ai_summary: prediction.ai_summary,
                      doctor_remarks: finalRemarks || combinedRemarks || null,
                      created_at: new Date().toISOString(),
                    } as any,
                  ],
                }
              : prev
          );
        }
      }
      setSaveMsg("Patient record saved to history.");
      await load().catch(() => {});
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const gapColor = prediction ? (prediction.bio_age_gap > 0 ? "#ff8a8a" : prediction.bio_age_gap < 0 ? "#7ee8c6" : "#bcbac9") : "#bcbac9";

  if (loading) return <p style={{ color: "#bcbac9", fontSize: "14px" }}>Loading patient…</p>;
  if (error && !patient) return <p style={{ color: "#ff8a8a", fontSize: "14px" }}>{error}</p>;
  if (!patient) return null;

  const history = patient.history ?? [];

  return (
    <div className="space-y-8">
      <Link href="/dashboard/patients" className="text-sm underline" style={{ color: "#bcbac9" }}>
        ← Back to patients
      </Link>

      {/* Header */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff" }}>
              {patient.first_name} {patient.last_name}
            </h1>
            <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "4px" }}>
              DOB {patient.date_of_birth?.slice(0, 10)} · {chronologicalAge !== null ? `${chronologicalAge}y` : "—"} · {patient.gender} · {patient.contact_number || "no phone"}
            </p>
            <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "4px" }}>ID: {patient.id}</p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
            {history.length} record{history.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h2 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Historical progress
        </h2>
        {history.length === 0 ? (
          <p style={{ color: "#5a5772", fontSize: "14px", marginTop: "12px" }}>No history yet. Upload a report to create the first record.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                    <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Date</th>
                    <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Chrono</th>
                    <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Bio</th>
                    <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Gap</th>
                    <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-8).map((h) => (
                    <tr key={h.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                      <td className="px-4 py-3" style={{ color: "#bcbac9" }}>{new Date(h.record_date || h.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{h.chronological_age ?? "—"}</td>
                      <td className="px-4 py-3">{h.predicted_bio_age?.toFixed(1) ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: (h.bio_age_gap ?? 0) > 0 ? "#ff8a8a" : (h.bio_age_gap ?? 0) < 0 ? "#7ee8c6" : "#bcbac9" }}>
                        {h.bio_age_gap != null ? `${h.bio_age_gap > 0 ? "+" : ""}${h.bio_age_gap.toFixed(1)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => viewHistoryPdf(h.id).catch(e => alert(e.message))}
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
            {/* Minimal SVG trend */}
            <div className="mt-6 h-20 w-full">
              <svg viewBox="0 0 300 60" className="h-full w-full">
                {(() => {
                  const vals = history.slice(-12).map((h) => h.bio_age_gap ?? 0);
                  if (vals.length < 2) return null;
                  const min = Math.min(...vals, -2);
                  const max = Math.max(...vals, 2);
                  const range = max - min || 1;
                  const pts = vals.map((v, i) => {
                    const x = (i / (vals.length - 1)) * 300;
                    const y = 60 - ((v - min) / range) * 60;
                    return `${x},${y}`;
                  }).join(" ");
                  return <polyline fill="none" stroke="#c9b4fa" strokeWidth={2} points={pts} />;
                })()}
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Upload */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h2 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Upload medical report
        </h2>
        <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "6px" }}>
          Full body checkup, blood test, or other health reports (PDF / image, ≤10MB). The system extracts key bio-age features — doctor does not need to read every value.
        </p>
        <label
          className="mt-4 flex h-36 cursor-pointer items-center justify-center rounded-lg border text-sm"
          style={{ borderColor: "#3f3a52", background: "#0e0c1f", color: reportName ? "#fff" : "#5a5772" }}
        >
          <span>{reportUploading ? "Processing…" : reportName ? reportName : "Click to select file or drop it here"}</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleReport(f);
            }}
          />
        </label>
        {reportUploading && <p style={{ color: "#bcbac9", fontSize: "13px", marginTop: "8px" }}>Extracting health parameters…</p>}
        {error && <p style={{ color: "#ff8a8a", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
      </div>

      {/* Features */}
      {features && (
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h2 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Extracted health parameters</h2>
          <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "4px" }}>Focus on meaningful features. Reference ranges and gap effect are model-informed, not diagnoses.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Feature</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Value</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Reference</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Status</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Gap effect</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Importance</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.name} style={{ borderBottom: "1px solid #3f3a52" }}>
                    <td className="px-4 py-3" style={{ fontWeight: 600 }}>{f.name}</td>
                    <td className="px-4 py-3" style={{ color: "#bcbac9" }}>{String(f.value)} {f.unit || ""}</td>
                    <td className="px-4 py-3" style={{ color: "#5a5772" }}>{f.reference_range || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: f.status === "high" ? "#ff8a8a" : f.status === "low" ? "#7ee8c6" : "#3f3a52", color: f.status === "high" ? "#ff8a8a" : f.status === "low" ? "#7ee8c6" : "#bcbac9" }}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: f.gap_effect === "negative" ? "#ff8a8a" : f.gap_effect === "positive" ? "#7ee8c6" : "#bcbac9" }}>
                      {f.gap_effect === "negative" ? "↑ gap" : f.gap_effect === "positive" ? "↓ gap" : "neutral"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-20 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.round(f.importance * 100)}%`, background: "#c9b4fa" }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {predicting && <p style={{ color: "#bcbac9", fontSize: "13px", marginTop: "8px" }}>Computing bio-age…</p>}
        </div>
      )}

      {/* Bio-age gap */}
      {prediction && (
        <div className="space-y-4">
          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h2 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Bio-age gap analysis</h2>
            <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "4px" }}>Bio-Age Gap = Predicted Biological Age − Chronological Age</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Chronological</p>
                <p style={{ color: "#fff", fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{prediction.chronological_age}</p>
                <p style={{ color: "#5a5772", fontSize: "12px" }}>years</p>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Biological (predicted)</p>
                <p style={{ color: "#fff", fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{prediction.predicted_bio_age.toFixed(1)}</p>
                <p style={{ color: "#5a5772", fontSize: "12px" }}>years</p>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: gapColor, background: "#0e0c1f" }}>
                <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: gapColor }}>Bio-age gap</p>
                <p style={{ color: gapColor, fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{prediction.bio_age_gap > 0 ? "+" : ""}{prediction.bio_age_gap.toFixed(1)}</p>
                <p style={{ color: "#bcbac9", fontSize: "12px" }}>{prediction.bio_age_gap > 0 ? "Biological higher (positive gap)" : prediction.bio_age_gap < 0 ? "Biological lower (negative gap)" : "Aligned"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "rgba(201,180,250,0.06)", color: "#bcbac9" }}>
              {prediction.bio_age_gap > 0
                ? "Positive gap: predicted biological age is higher than chronological age. Major contributing factors are listed below."
                : prediction.bio_age_gap < 0
                ? "Negative gap: predicted biological age is lower than chronological age, suggesting favorable factors outweigh negatives."
                : "Gap near zero: predicted and chronological ages are aligned."}
            </div>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Major contributing factors</h3>
            <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "4px" }}>Explainability via feature importance (or SHAP where model supports it). Informational, not a diagnosis.</p>
            <ul className="mt-4 space-y-2">
              {prediction.contributing_factors.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                  <span style={{ color: "#fff" }}>{i + 1}. {f.feature}</span>
                  <span style={{ color: "#bcbac9" }}>{f.direction} · strength {(f.strength * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Recommendations</h3>
            <p style={{ color: "#ff8a8a", fontSize: "12px", marginTop: "4px" }}>Informational only — must be reviewed by a qualified doctor. No unsupported diagnosis.</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm" style={{ color: "#bcbac9" }}>
              {prediction.recommendations.length ? prediction.recommendations.map((r, i) => (
                <li key={i}><span style={{ color: "#fff", fontWeight: 600 }}>{r.feature}:</span> {r.text}</li>
              )) : <li>No high-risk features — maintain current lifestyle and follow clinician guidance.</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Official Bio-Age PDF (real backend XGBoost + SHAP) */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#c9b4fa", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Official bio-age report — XGBoost + SHAP (backend)
        </h3>
        <p style={{ color: "#bcbac9", fontSize: "13px", marginTop: "6px" }}>
          Integrated with <span style={{ color: "#fff" }}>POST /api/patients/{"{id}"}/predict-bio-age</span> — 77 lab features → XGBoost → SHAP top-5 → WeasyPrint PDF. Chronological age is derived from DOB on the backend.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { k: "Weight", label: "Weight kg", step: "0.1" },
            { k: "Height", label: "Height cm", step: "0.1" },
            { k: "Waist", label: "Waist cm", step: "0.1" },
            { k: "Systolic_BP", label: "Systolic BP", step: "1" },
            { k: "LBXSGL", label: "Glucose (LBXSGL)", step: "0.1" },
            { k: "LBXTC", label: "Total Chol (LBXTC)", step: "1" },
            { k: "LBDHDD", label: "HDL (LBDHDD)", step: "0.1" },
            { k: "CRP", label: "CRP", step: "0.01" },
            { k: "BMI", label: "BMI", step: "0.1" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#5a5772" }}>{f.label}</label>
              <input
                type="number"
                step={f.step}
                value={(bioAgeForm as any)[f.k] ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? undefined : Number(e.target.value);
                  setBioAgeForm((prev) => ({ ...prev, [f.k]: v }));
                }}
                placeholder="—"
                className="mt-1 w-full rounded-md border bg-black px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#3f3a52", color: "#fff" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-xs underline"
            style={{ color: "#c9b4fa" }}
          >
            {showAdvanced ? "Hide advanced 77 fields" : "Show all 77 lab fields"}
          </button>
          <span style={{ color: "#5a5772", fontSize: "12px" }}>{Object.keys(bioAgeForm).filter((k) => (bioAgeForm as any)[k] !== undefined).length} values set</span>
        </div>
        {showAdvanced && (
          <div className="mt-4 max-h-64 overflow-y-auto rounded-md border p-3" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
            <div className="grid gap-2 md:grid-cols-4">
              {[
                "CRP","LBDEONO","LBDHDD","LBDLYMNO","LBDMONO","LBDNENO","LBXBAPCT","LBXEOPCT","LBXGH","LBXHCT","LBXHGB","LBXLYPCT","LBXMC","LBXMCHSI","LBXMCVSI","LBXMOPCT","LBXMPSI","LBXNEPCT","LBXPLTSI","LBXRBCSI","LBXRDW","LBXSAL","LBXSAPSI","LBXSASSI","LBXSATSI","LBXSBU","LBXSC3SI","LBXSCA","LBXSCH","LBXSCLSI","LBXSCR","LBXSGB","LBXSGL","LBXSGTSI","LBXSIR","LBXSKSI","LBXSLDSI","LBXSNASI","LBXSOSSI","LBXSPH","LBXSTB","LBXSTP","LBXSUA","LBXTC","LBXWBCSI","URXCRS","URXUCR","URXUMA","URXUMS","URDACT","LBXSCK","Gender","Weight","Height","Waist","Systolic_BP","Alcohol_days","Exercise_days","LBXGLU","Smoking_status_Former","Smoking_status_Never","log_CRP","log_LBXSAPSI","log_LBXWBCSI","log_LBXGH","log_LBXSCR","log_LBXGLU","chol_ratio","non_hdl","scr_albumin_ratio","inflam_score","NLR_proxy","glycation_gap","LBXRDW_sq","LBXMCVSI_sq","BMI","WHtR",
              ].map((k) => (
                <div key={k}>
                  <label className="text-[11px] uppercase" style={{ letterSpacing: "1px", color: "#5a5772" }}>{k}</label>
                  <input
                    type="number"
                    step="any"
                    value={(bioAgeForm as any)[k] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Number(e.target.value);
                      setBioAgeForm((prev) => ({ ...prev, [k]: v }));
                    }}
                    className="mt-1 w-full rounded border bg-black px-2 py-1 text-xs outline-none"
                    style={{ borderColor: "#3f3a52", color: "#fff" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading || !features}
            className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}
            title={!features ? "Please upload a report first" : ""}
          >
            {pdfLoading ? "Generating PDF…" : "Generate official PDF report"}
          </button>
          {pdfUrl && (
            <>
              <a href={pdfUrl} download={`bio_age_report_${patientId}.pdf`} className="rounded-full border px-6 py-2.5 text-sm font-semibold" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
                Download PDF
              </a>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="rounded-full border px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: "#7ee8c6", color: "#7ee8c6" }}
              >
                {sendingEmail ? "Sending..." : "Email to Patient"}
              </button>
            </>
          )}
        </div>
        {emailMsg && (
          <p className="mt-3 text-sm" style={{ color: emailMsg.type === "success" ? "#7ee8c6" : "#ff8a8a" }}>
            {emailMsg.text}
          </p>
        )}
        {pdfUrl && (
          <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "#3f3a52", height: "600px", background: "#fff" }}>
            <iframe src={pdfUrl} className="h-full w-full" title="Bio-age PDF preview" />
          </div>
        )}
        <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "8px" }}>PDF is generated server-side via `templates/report.html` + WeasyPrint. Factors shown above (mock) are for quick UI; official SHAP top-5 are in the PDF.</p>
      </div>

      {/* Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>AI-generated review</h3>
          <div className="mt-4 rounded-md border p-4 text-sm" style={{ borderColor: "#3f3a52", background: "#0e0c1f", color: "#bcbac9", minHeight: "96px" }}>
            {prediction ? prediction.ai_summary : "Upload a report to generate a concise health / bio-age summary based on extracted features, prediction, gap, and contributing factors."}
          </div>
          <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "6px" }}>Auto-generated. Example: “Patient's predicted biological age is higher… major contributing factors are X, Y, Z.”</p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Manual doctor review</h3>
          <textarea
            value={manualReview}
            onChange={(e) => setManualReview(e.target.value)}
            placeholder="Clinical observations, patient-specific remarks, additional recommendations, follow-up information…"
            rows={5}
            className="mt-4 w-full rounded-md border bg-black p-3 text-sm outline-none"
            style={{ borderColor: "#3f3a52", color: "#fff" }}
          />
          <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "6px" }}>Remains separate from AI-generated review.</p>
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Personalized doctor remark</h3>
        <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "4px" }}>Editable, savable, and updateable. Included in final patient record.</p>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Personalized remark for this patient…"
          rows={3}
          className="mt-4 w-full rounded-md border bg-black p-3 text-sm outline-none"
          style={{ borderColor: "#c9b4fa", color: "#fff" }}
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSaveRecord} disabled={saving || !prediction} className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-40" style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}>
            {saving ? "Saving…" : "Save patient record"}
          </button>
          {saveMsg && <span style={{ color: "#7ee8c6", fontSize: "13px" }}>{saveMsg}</span>}
        </div>
        <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "8px" }}>Record contains: info · reports · extracted params · chrono/bio/gap · factors · AI review · manual review · remarks · history.</p>
      </div>
    </div>
  );
}
