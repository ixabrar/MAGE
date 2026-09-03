"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import DorsalHandExplainability from "@/components/DorsalHandExplainability";

const DEMO_TRACKING_KEY = "mage:dorsal-demo-tracking";

type DemoDorsalHistory = {
  tracking_enabled: boolean;
  baseline_predicted_age: number | null;
  baseline_at: string | null;
  latest_predicted_age: number | null;
  change_from_baseline: number | null;
  predictions: Array<{
    id: string;
    predicted_at: string;
    predicted_age: number;
    confidence: number;
    age_bins: Record<string, number>;
    is_baseline: boolean;
  }>;
};

export default function AssessmentResultInner() {
  const router = useRouter();
  const params = useSearchParams();
  const assessmentId = params.get("assessment_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dorsalExplanation, setDorsalExplanation] = useState<{ predicted_age: number; confidence: number; age_bins: Record<string, number>; gradcam_data_url: string | null; original_image_data_url: string | null } | null>(null);
  const [trackingPrompt, setTrackingPrompt] = useState(true);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [dorsalHistory, setDorsalHistory] = useState<DemoDorsalHistory | null>(null);
  const [result, setResult] = useState<{
    assessment_id: string;
    created_at: string;
    result: {
      fused_predicted_age: number;
      fused_confidence: number;
      fused_age_bins: Record<string, number>;
      model_contributions: Record<string, number>;
    };
  } | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiBase}/api/assessment/${assessmentId}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Failed to load assessment");
        }
        if (!cancelled) {
          const data = await response.json();
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assessment");
          setLoading(false);
        }
      }
    }

    load();

    const storedExplanation = sessionStorage.getItem("mage:dorsal-explanation");
    if (storedExplanation) {
      try {
        const explanation = JSON.parse(storedExplanation);
        setDorsalExplanation(explanation);
        const storedTracking = localStorage.getItem(DEMO_TRACKING_KEY);
        if (storedTracking) {
          const history = JSON.parse(storedTracking) as DemoDorsalHistory;
          if (history.tracking_enabled && !history.predictions.some((point) => point.id === assessmentId)) {
            const nextPoint = {
              id: assessmentId,
              predicted_at: new Date().toISOString(),
              predicted_age: explanation.predicted_age,
              confidence: explanation.confidence,
              age_bins: explanation.age_bins,
              is_baseline: false,
            };
            const predictions = [...history.predictions, nextPoint];
            const latest = predictions[predictions.length - 1];
            const nextHistory = { ...history, predictions, latest_predicted_age: latest.predicted_age, change_from_baseline: history.baseline_predicted_age == null ? null : Number((latest.predicted_age - history.baseline_predicted_age).toFixed(1)) };
            localStorage.setItem(DEMO_TRACKING_KEY, JSON.stringify(nextHistory));
            setDorsalHistory(nextHistory);
            setTrackingPrompt(false);
          }
        }
      } catch {
        sessionStorage.removeItem("mage:dorsal-explanation");
      }
    }

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const handleStartTracking = () => {
    if (!dorsalExplanation) return;
    setTrackingBusy(true);
    setTrackingError(null);
    const baseline = {
      id: assessmentId ?? `demo-${Date.now()}`,
      predicted_at: new Date().toISOString(),
      predicted_age: dorsalExplanation.predicted_age,
      confidence: dorsalExplanation.confidence,
      age_bins: dorsalExplanation.age_bins,
      is_baseline: true,
    };
    const history: DemoDorsalHistory = {
      tracking_enabled: true,
      baseline_predicted_age: baseline.predicted_age,
      baseline_at: baseline.predicted_at,
      latest_predicted_age: baseline.predicted_age,
      change_from_baseline: 0,
      predictions: [baseline],
    };
    localStorage.setItem(DEMO_TRACKING_KEY, JSON.stringify(history));
    setDorsalHistory(history);
    setTrackingPrompt(false);
    setTrackingBusy(false);
  };

  const trendPoints = dorsalHistory?.predictions ?? [];
  const chartValues = trendPoints.map((point) => point.predicted_age);
  const chartMin = chartValues.length ? Math.floor(Math.min(...chartValues) - 1) : 0;
  const chartMax = chartValues.length ? Math.ceil(Math.max(...chartValues) + 1) : 100;
  const chartRange = Math.max(chartMax - chartMin, 1);

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <nav className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold uppercase transition-colors duration-150 hover:border-white hover:bg-white/6"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "1.8px",
              color: "#bcbac9",
            }}
          >
            ← MAGE
          </a>
          <div className="text-sm" style={{ color: "#5a5772" }}>
            Assessment complete
          </div>
        </nav>

        <div className="mt-16 max-w-2xl">
          <h1
            className="text-4xl font-medium tracking-tight"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "48px",
              fontWeight: 460,
              lineHeight: 0.96,
              letterSpacing: "-1.32px",
              color: "#ffffff",
            }}
          >
            Estimated biological age
          </h1>
          <p
            className="mt-6 text-lg"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "18px",
              fontWeight: 540,
              lineHeight: 1.5,
              letterSpacing: "-0.135px",
              color: "#bcbac9",
            }}
          >
            AI-generated estimate for informational/research purposes; not a medical diagnosis.
          </p>

          {loading && (
            <p className="mt-10 text-sm" style={{ color: "#bcbac9" }}>
              Loading assessment result…
            </p>
          )}

          {error && (
            <p className="mt-10 text-sm" style={{ color: "#ff8a8a" }}>
              {error}
            </p>
          )}

          {result && (
            <>
              <motion.div
                className="mt-10 rounded-xl border p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: "#000000",
                  borderColor: "#3f3a52",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: "#c9b4fa",
                  }}
                >
                  Estimate
                </p>
                <p
                  className="mt-2 text-6xl font-medium"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "64px",
                    fontWeight: 540,
                    lineHeight: 1,
                    letterSpacing: "0px",
                    color: "#ffffff",
                  }}
                >
                  {result.result.fused_predicted_age.toFixed(1)}
                </p>
                <p className="mt-2 text-base" style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 460,
                  lineHeight: 1.4,
                  letterSpacing: "0px",
                  color: "#bcbac9",
                }}>
                  years
                </p>
              </motion.div>

              <p className="mt-6 text-sm" style={{ color: "#5a5772" }}>
                Dorsal-hand estimate from ResNet18 (128M). For public assessments only the predicted age is shown.
              </p>

              {dorsalExplanation && (
                <div className="mt-8 rounded-xl border p-6" style={{ borderColor: "#3f3a52" }}>
                  <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Dorsal hand analysis</p>
                  <div className="mt-5 space-y-3">
                    {Object.entries(dorsalExplanation.age_bins).map(([label, value]) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm" style={{ color: "#bcbac9" }}>
                          <span>{label}</span>
                          <span>{(Number(value) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: "#3f3a52" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(value) * 100))}%`, background: "#c9b4fa" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {dorsalExplanation.gradcam_data_url && dorsalExplanation.original_image_data_url && (
                    <>
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {[
                          ["Input", dorsalExplanation.original_image_data_url, "Selected dorsal hand"],
                          ["Model focus", dorsalExplanation.gradcam_data_url, "Grad-CAM focus overlay for the selected dorsal hand"],
                        ].map(([label, src, alt]) => (
                          <div key={label}>
                            <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>{label}</p>
                            <img src={src} alt={alt} className="mt-3 aspect-square h-auto w-full rounded-lg border object-contain" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#8f8aa4" }}>
                        <span>Low focus</span>
                        <span className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #3136d8, #20cbd2, #f4e34b, #e43b28)" }} />
                        <span>High focus</span>
                      </div>
                    </>
                  )}
                  <DorsalHandExplainability />
                </div>
              )}

              {dorsalExplanation && trackingPrompt && (
                <div className="mt-8 rounded-xl border p-6" style={{ borderColor: "#f0a33a", background: "rgba(240,163,58,.06)" }}>
                  <p className="text-lg font-semibold" style={{ color: "#ffffff" }}>Track your aging trend over time?</p>
                  <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>Save this model-estimated age as your personal baseline and compare future dorsal-hand scans.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleStartTracking} disabled={trackingBusy} className="rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: "#f0a33a", color: "#17120a" }}>
                      {trackingBusy ? "Saving baseline…" : "Start Tracking"}
                    </button>
                    <button type="button" onClick={() => setTrackingPrompt(false)} className="rounded-full border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>Not Now</button>
                  </div>
                  {trackingError && <p className="mt-3 text-sm" style={{ color: "#ff8a8a" }}>{trackingError}. Sign in to save a personal trend.</p>}
                </div>
              )}

              {dorsalHistory?.tracking_enabled && (
                <div className="mt-8 rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#080712" }}>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>AI-estimated age trend</p>
                      <p className="mt-2 text-sm" style={{ color: "#8f8aa4" }}>Your saved dorsal-hand model predictions over time.</p>
                    </div>
                    <p className="text-xs" style={{ color: "#8f8aa4" }}>{trendPoints.length} scan{trendPoints.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Baseline", dorsalHistory.baseline_predicted_age == null ? "—" : `${dorsalHistory.baseline_predicted_age.toFixed(1)} yrs`],
                      ["Latest", dorsalHistory.latest_predicted_age == null ? "—" : `${dorsalHistory.latest_predicted_age.toFixed(1)} yrs`],
                      ["Change", dorsalHistory.change_from_baseline == null ? "—" : `${dorsalHistory.change_from_baseline >= 0 ? "+" : ""}${dorsalHistory.change_from_baseline.toFixed(1)} yrs`],
                      ["Latest confidence", trendPoints.length ? `${(trendPoints[trendPoints.length - 1].confidence * 100).toFixed(0)}%` : "—"],
                    ].map(([label, value]) => <div key={label} className="rounded-lg border p-3" style={{ borderColor: "#242136" }}><p className="text-xs uppercase" style={{ color: "#8f8aa4", letterSpacing: "1px" }}>{label}</p><p className="mt-1 text-lg font-semibold" style={{ color: "#ffffff" }}>{value}</p></div>)}
                  </div>
                  {trendPoints.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                      <svg viewBox="0 0 640 250" role="img" aria-label="AI-estimated age trend graph" className="h-auto min-w-[520px] w-full">
                        <line x1="48" y1="18" x2="48" y2="210" stroke="#3f3a52" />
                        <line x1="48" y1="210" x2="620" y2="210" stroke="#3f3a52" />
                        <text x="10" y="28" fill="#8f8aa4" fontSize="11">{chartMax}</text>
                        <text x="10" y="214" fill="#8f8aa4" fontSize="11">{chartMin}</text>
                        <polyline fill="none" stroke="#f0a33a" strokeWidth="3" points={trendPoints.map((point, index) => {
                          const x = trendPoints.length === 1 ? 334 : 54 + (index / (trendPoints.length - 1)) * 556;
                          const y = 204 - ((point.predicted_age - chartMin) / chartRange) * 180;
                          return `${x},${y}`;
                        }).join(" ")} />
                        {trendPoints.map((point, index) => {
                          const x = trendPoints.length === 1 ? 334 : 54 + (index / (trendPoints.length - 1)) * 556;
                          const y = 204 - ((point.predicted_age - chartMin) / chartRange) * 180;
                          return <circle key={point.id} cx={x} cy={y} r="5" fill="#f0a33a" stroke="#080712" strokeWidth="2"><title>{new Date(point.predicted_at).toLocaleDateString()} — {point.predicted_age.toFixed(1)} years</title></circle>;
                        })}
                        {trendPoints.map((point, index) => <text key={`${point.id}-date`} x={trendPoints.length === 1 ? 334 : 54 + (index / (trendPoints.length - 1)) * 556} y="232" textAnchor="middle" fill="#8f8aa4" fontSize="10">{new Date(point.predicted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</text>)}
                      </svg>
                    </div>
                  )}
                  <div className="mt-5 border-t pt-4" style={{ borderColor: "#242136" }}>
                    <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#8f8aa4" }}>For comparable scans</p>
                    <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>Use the same hand, similar lighting, a similar hand position and camera distance, and a clear photo of the back of your hand.</p>
                  </div>
                </div>
              )}

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => router.push("/assessment")}
                  className="rounded-full border px-6 py-3 text-base font-semibold transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: 1.0,
                    letterSpacing: "0px",
                    borderColor: "#3f3a52",
                    color: "#ffffff",
                  }}
                >
                  New assessment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
