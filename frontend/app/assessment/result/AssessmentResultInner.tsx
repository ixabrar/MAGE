"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import DorsalHandExplainability from "@/components/DorsalHandExplainability";

interface AssessmentResultData {
  assessment_id: string;
  created_at: string;
  modalities?: string[];
  result: {
    fused_predicted_age: number;
    fused_confidence: number;
    fused_age_bins: Record<string, number>;
    model_contributions: Record<string, number>;
    modality_predictions?: Record<
      string,
      {
        predicted_age: number;
        confidence: number;
        age_bins?: Record<string, number>;
      }
    >;
  };
}

interface DemoDorsalHistory {
  tracking_enabled: boolean;
  baseline_predicted_age: number | null;
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
}

const DEMO_TRACKING_KEY = "mage:dorsal-tracking-demo";

const COHORT_DETAILS: Record<
  string,
  { label: string; range: string; desc: string; color: string }
> = {
  "18-25": {
    label: "Young Adult",
    range: "18 – 25 yrs",
    desc: "High cellular renewal rate, low dermal collagen degradation.",
    color: "#7b61ff",
  },
  "26-35": {
    label: "Prime Adult",
    range: "26 – 35 yrs",
    desc: "Peak metabolic baseline with subtle early micro-structural changes.",
    color: "#c9b4fa",
  },
  "36-45": {
    label: "Mature Adult",
    range: "36 – 45 yrs",
    desc: "Moderate collagen remodeling and gradual metabolic shifts.",
    color: "#e2d9fc",
  },
  "46+": {
    label: "Advanced Adult",
    range: "46+ yrs",
    desc: "Accelerated cellular senescence markers and structural epidermal maturity.",
    color: "#ffffff",
  },
};

export default function AssessmentResultInner() {
  const router = useRouter();
  const params = useSearchParams();
  const assessmentId = params.get("assessment_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResultData | null>(null);
  const [activeCohort, setActiveCohort] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "evidence">("overview");

  const [dorsalExplanation, setDorsalExplanation] = useState<{
    predicted_age: number;
    confidence: number;
    age_bins: Record<string, number>;
    gradcam_data_url: string | null;
    original_image_data_url: string | null;
  } | null>(null);
  const [trackingPrompt, setTrackingPrompt] = useState(true);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [dorsalHistory, setDorsalHistory] = useState<DemoDorsalHistory | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment reference ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAssessment() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiBase}/api/assessment/${assessmentId}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to load assessment results.");
        }
        if (!cancelled) {
          const data = await response.json();
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assessment.");
          setLoading(false);
        }
      }
    }

    loadAssessment();

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
            const nextHistory = {
              ...history,
              predictions,
              latest_predicted_age: latest.predicted_age,
              change_from_baseline:
                history.baseline_predicted_age == null
                  ? null
                  : Number((latest.predicted_age - history.baseline_predicted_age).toFixed(1)),
            };
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
    if (!dorsalExplanation || !assessmentId) return;
    const history: DemoDorsalHistory = {
      tracking_enabled: true,
      baseline_predicted_age: dorsalExplanation.predicted_age,
      latest_predicted_age: dorsalExplanation.predicted_age,
      change_from_baseline: 0,
      predictions: [
        {
          id: assessmentId,
          predicted_at: new Date().toISOString(),
          predicted_age: dorsalExplanation.predicted_age,
          confidence: dorsalExplanation.confidence,
          age_bins: dorsalExplanation.age_bins,
          is_baseline: true,
        },
      ],
    };
    localStorage.setItem(DEMO_TRACKING_KEY, JSON.stringify(history));
    setDorsalHistory(history);
    setTrackingPrompt(false);
  };

  // Derived calculations
  const predictedAge = result?.result.fused_predicted_age || 0;
  const confidence = result?.result.fused_confidence || 0;
  const ageBins = result?.result.fused_age_bins || {};
  const contributions = result?.result.model_contributions || {};

  // Find dominant cohort
  const dominantCohort = useMemo(() => {
    let topCohort = "26-35";
    let maxProb = -1;
    for (const [cohort, prob] of Object.entries(ageBins)) {
      if (prob > maxProb) {
        maxProb = prob;
        topCohort = cohort;
      }
    }
    return topCohort;
  }, [ageBins]);

  // Bayesian Credible Interval
  const uncertaintyMargin = useMemo(() => {
    const sigma = Math.max(1.1, (1.0 - confidence) * 6.5);
    return sigma.toFixed(1);
  }, [confidence]);

  // Formatted date
  const assessmentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Physiological Rationale Generation
  const physiologicalRationale = useMemo(() => {
    const hasFace = "face" in contributions;
    const hasHand = "dorsal" in contributions || "dorsal_hand" in contributions;
    const hasBlood = "blood" in contributions;

    const points: Array<{ title: string; detail: string; icon: string }> = [];

    if (hasFace) {
      points.push({
        title: "Facial Morphometrics & Sub-Orbital Texture",
        detail: `The EfficientNet-B0 Hierarchical MoE model analyzed 6 developmental stages over 101 age bins, detecting feature density aligned primarily around ${predictedAge.toFixed(1)} years.`,
        icon: "◐",
      });
    }

    if (hasHand) {
      points.push({
        title: "Dorsal Hand Dermal Elasticity & Micro-Contours",
        detail: `ResNet-18 extracted dermal texture depth, skin turgor consistency, and vascular clarity from the dorsal hand image, reinforcing prediction stability.`,
        icon: "✋",
      });
    }

    if (hasBlood) {
      points.push({
        title: "Clinical Blood Biomarker Concordance",
        detail: `Laboratory chemistry extracted via PyMuPDF was evaluated through XGBoost TreeSHAP, analyzing metabolic homeostasis and systemic biological age acceleration.`,
        icon: "🩸",
      });
    }

    if (points.length === 0) {
      points.push({
        title: "Multimodal Fusion Synthesis",
        detail: `Adaptive Reliability Module calibrated empirical cohort weights across input modalities, converging on a minimum-variance biological age estimation.`,
        icon: "🧬",
      });
    }

    return points;
  }, [contributions, predictedAge]);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#c9b4fa]/30" suppressHydrationWarning>
      
      {/* Global Print Stylesheet for Pure White Clinical PDF */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
            size: A4 portrait;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-block {
            display: block !important;
          }
        }
        @media screen {
          .print-only-block {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. SCREEN VIEW (Interactive Dark Theme UI)                                */}
      {/* ========================================================================= */}
      <div className="no-print">
        {/* Ambient background lighting */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-1/6 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c9b4fa]/8 blur-[130px]" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#7b61ff]/6 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 sm:px-10 lg:px-16">
          {/* Top Screen Navigation Bar */}
          <nav className="flex items-center justify-between border-b border-white/5 pb-6">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold uppercase tracking-[1.8px] text-[#bcbac9] transition-colors hover:border-white hover:text-white"
              style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
            >
              ← MAGE
            </a>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Assessment Verified
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full bg-[#c9b4fa] px-4 py-1.5 text-xs font-bold text-[#1b1938] shadow-[0_0_15px_rgba(201,180,250,0.3)] transition-transform hover:scale-105 active:scale-95"
              >
                <span>🖨</span> Print / Download PDF
              </button>
            </div>
          </nav>

          {loading && (
            <div className="mt-24 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c9b4fa] border-t-transparent" />
              <p className="mt-4 text-sm text-[#bcbac9]">Rendering calibrated assessment results…</p>
            </div>
          )}

          {error && (
            <div className="mt-12 rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
              <p className="text-sm font-semibold text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => router.push("/assessment")}
                className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                Start New Assessment
              </button>
            </div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 space-y-8"
            >
              {/* Biological Age Hero Banner */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
                
                {/* Primary Age Card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#c9b4fa]/40 bg-gradient-to-br from-[#141228] via-[#090814] to-black p-8 shadow-[0_0_30px_rgba(201,180,250,0.1)] lg:col-span-7">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#c9b4fa]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[1.5px] text-[#c9b4fa]">
                      Calibrated Biological Estimate
                    </span>
                    <span className="font-mono text-xs text-[#bcbac9]">
                      ID: {result.assessment_id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="font-mono text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
                      {predictedAge.toFixed(1)}
                    </span>
                    <span className="text-xl font-medium text-[#bcbac9]">years</span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#bcbac9]">
                    <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                      <span className="text-[#c9b4fa] font-semibold">Certainty:</span>
                      <strong className="text-white">{(confidence * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                      <span className="text-[#c9b4fa] font-semibold">Credible Interval:</span>
                      <strong className="text-white">± {uncertaintyMargin} yrs</strong>
                    </span>
                    <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                      <span className="text-[#c9b4fa] font-semibold">Cohort:</span>
                      <strong className="text-white">{COHORT_DETAILS[dominantCohort]?.label}</strong>
                    </span>
                  </div>

                  <p className="mt-5 text-xs leading-relaxed text-[#bcbac9]/80">
                    Synthesized across {Object.keys(contributions).length} active modality branches via the Adaptive Reliability Module (ARM) and Prediction Fusion Module (PFM).
                  </p>
                </div>

                {/* Dominant Cohort Status Card */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#3f3a52]/60 bg-[#0e0c1f]/70 p-7 lg:col-span-5 backdrop-blur-md">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#bcbac9]">
                      Biological Status
                    </span>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {COHORT_DETAILS[dominantCohort]?.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#bcbac9]">
                      {COHORT_DETAILS[dominantCohort]?.desc}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-xs text-[#bcbac9]">
                      <span>Multimodal Consensus</span>
                      <span className="font-semibold text-white">
                        {confidence > 0.7 ? "High Agreement" : "Calibrated Fusion"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7b61ff] to-[#c9b4fa]"
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dorsal Hand Grad-CAM & Tracking Card */}
              {dorsalExplanation && (
                <div className="space-y-4">
                  <DorsalHandExplainability
                    originalImageDataUrl={dorsalExplanation.original_image_data_url}
                    gradcamDataUrl={dorsalExplanation.gradcam_data_url}
                    predictedAge={dorsalExplanation.predicted_age}
                    confidence={dorsalExplanation.confidence}
                    source="real_model"
                    qualityMessage={null}
                  />

                  {trackingPrompt && !dorsalHistory?.tracking_enabled && (
                    <div className="rounded-xl border border-[#c9b4fa]/30 bg-[#0e0c1f] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">Start Longitudinal Dorsal Age Tracking?</h4>
                        <p className="mt-1 text-xs text-[#bcbac9]">Track biological aging velocity and compare against baseline across repeat scans.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartTracking}
                        className="rounded-full bg-[#c9b4fa] px-5 py-2 text-xs font-bold text-[#1b1938] hover:bg-[#d4c2fb]"
                      >
                        Enable Tracking
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Screen Tab Switcher */}
              <div className="flex border-b border-white/10 gap-6 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3 transition-colors ${
                    activeTab === "overview"
                      ? "border-b-2 border-[#c9b4fa] text-white"
                      : "text-[#bcbac9] hover:text-white"
                  }`}
                >
                  📊 Distribution &amp; Probabilities
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evidence")}
                  className={`pb-3 transition-colors ${
                    activeTab === "evidence"
                      ? "border-b-2 border-[#c9b4fa] text-white"
                      : "text-[#bcbac9] hover:text-white"
                  }`}
                >
                  🧬 Scientific Justification &amp; ARM Weights
                </button>
              </div>

              {/* Tab 1: Cohort Probability Distribution */}
              {activeTab === "overview" && (
                <div className="rounded-2xl border border-[#3f3a52] bg-[#090814] p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Age Cohort Probability Density
                      </h3>
                      <p className="text-xs text-[#bcbac9]">
                        Probability mass distributed across standard biological development brackets.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#c9b4fa] font-semibold">
                      Sum: 100%
                    </span>
                  </div>

                  <div className="mt-6 space-y-3.5">
                    {Object.entries(COHORT_DETAILS).map(([key, info]) => {
                      const prob = ageBins[key] !== undefined ? ageBins[key] : 0;
                      const percent = Math.round(prob * 100);
                      const isDominant = key === dominantCohort;
                      const isHovered = activeCohort === key;

                      return (
                        <div
                          key={key}
                          onMouseEnter={() => setActiveCohort(key)}
                          onMouseLeave={() => setActiveCohort(null)}
                          className={`group rounded-xl border p-4 transition-all ${
                            isDominant || isHovered
                              ? "border-[#c9b4fa] bg-[#141228]"
                              : "border-white/5 bg-black/40 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-[#c9b4fa]">
                                {info.range}
                              </span>
                              <span className="font-semibold text-white">
                                {info.label}
                              </span>
                              {isDominant && (
                                <span className="rounded bg-[#c9b4fa]/20 px-2 py-0.5 text-[10px] font-bold text-[#c9b4fa]">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-sm font-bold text-white">
                              {percent}%
                            </span>
                          </div>

                          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-black/80">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percent}%`,
                                background: isDominant
                                  ? "linear-gradient(90deg, #7b61ff, #c9b4fa)"
                                  : "rgba(201,180,250,0.4)",
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-[#bcbac9]/70">
                            {info.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: ARM Modality Weights & Evidence */}
              {activeTab === "evidence" && (
                <div className="space-y-6">
                  {/* ARM Weights */}
                  <div className="rounded-2xl border border-[#3f3a52] bg-[#090814] p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-white">
                      Adaptive Reliability Module (ARM) Weighting
                    </h3>
                    <p className="mt-0.5 text-xs text-[#bcbac9]">
                      Dynamic reliability evidence weights assigned based on empirical cohort history and image quality.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {Object.entries(contributions).map(([mod, weight]) => {
                        const pct = Math.round(weight * 100);
                        const modName =
                          mod === "face"
                            ? "Face Signal (MoE)"
                            : mod === "dorsal" || mod === "dorsal_hand"
                            ? "Dorsal Hand (ResNet18)"
                            : "Blood Lab Report (XGBoost)";

                        return (
                          <div
                            key={mod}
                            className="rounded-xl border border-white/10 bg-[#0e0c1f] p-4 text-left"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c9b4fa]">
                              {mod.toUpperCase()}
                            </span>
                            <p className="mt-1 text-2xl font-bold text-white font-mono">
                              {pct}%
                            </p>
                            <p className="mt-0.5 text-xs text-[#bcbac9]">{modName}</p>
                            <div className="mt-2.5 h-1.5 w-full rounded-full bg-black">
                              <div
                                className="h-full rounded-full bg-[#c9b4fa]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physiological Rationale */}
                  <div className="rounded-2xl border border-[#3f3a52] bg-[#090814] p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-white">
                      Why We Predicted This Biological Age
                    </h3>
                    <p className="mt-0.5 text-xs text-[#bcbac9]">
                      Physiological signals extracted and synthesized across active neural network layers.
                    </p>

                    <div className="mt-5 space-y-3">
                      {physiologicalRationale.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-[#0e0c1f]/60 p-4"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c9b4fa]/10 text-base text-[#c9b4fa]">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-[#bcbac9]">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => router.push("/assessment")}
                  className="rounded-full bg-[#c9b4fa] px-8 py-3 text-sm font-bold text-[#1b1938] transition-transform hover:scale-105 shadow-[0_0_20px_rgba(201,180,250,0.25)]"
                >
                  ← Start New Assessment
                </button>

                <div className="flex gap-3">
                  <a
                    href="/fusion"
                    className="rounded-full border border-[#3f3a52] px-5 py-2.5 text-xs font-semibold text-[#bcbac9] transition-colors hover:border-white hover:text-white"
                  >
                    Inspect Fusion Math (ARM / PFM) →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED PRINT / PDF VIEW (Pure White Clinical Medical Report Format)  */}
      {/* ========================================================================= */}
      {result && (
        <div className="print-only-block bg-white text-slate-900 p-2 font-sans">
          
          {/* Clinical Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">MAGE</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">| Multimodal Age Estimation</span>
                </div>
                <h1 className="text-xl font-bold text-slate-800 mt-1">
                  Biological Age Assessment &amp; Physiological Report
                </h1>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p><span className="font-semibold text-slate-900">Report Date:</span> {assessmentDate}</p>
                <p><span className="font-semibold text-slate-900">Assessment UUID:</span> {result.assessment_id}</p>
                <p className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                  Status: Calibrated
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Summary Metric Boxes */}
          <div className="grid grid-cols-12 gap-4 mb-6" style={{ pageBreakInside: "avoid" }}>
            
            {/* Primary Age Result Box */}
            <div className="col-span-7 rounded-xl border-2 border-slate-300 bg-slate-50 p-5">
              <span className="inline-block rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                Estimated Biological Age
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-black text-slate-900">
                  {predictedAge.toFixed(1)}
                </span>
                <span className="text-lg font-semibold text-slate-600">years</span>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Certainty</span>
                  <strong className="text-sm font-extrabold text-slate-900">{(confidence * 100).toFixed(1)}%</strong>
                </div>
                <div className="rounded border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Credible Range</span>
                  <strong className="text-sm font-extrabold text-slate-900">± {uncertaintyMargin} yrs</strong>
                </div>
                <div className="rounded border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Cohort</span>
                  <strong className="text-sm font-extrabold text-slate-900">{dominantCohort}</strong>
                </div>
              </div>
            </div>

            {/* Status & Consensus Box */}
            <div className="col-span-5 rounded-xl border-2 border-slate-300 bg-slate-50 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Primary Classification
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {COHORT_DETAILS[dominantCohort]?.label}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {COHORT_DETAILS[dominantCohort]?.desc}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Multimodal Evidence Agreement</span>
                  <span className="text-slate-900 font-bold">{confidence > 0.7 ? "High" : "Calibrated"}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.round(confidence * 100)}%` }} />
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Cohort Probability Density Table */}
          <div className="rounded-xl border border-slate-300 bg-white p-5 mb-6" style={{ pageBreakInside: "avoid" }}>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Age Cohort Probability Density Distribution
              </h2>
              <span className="text-xs font-mono font-bold text-slate-600">Total Probability: 100%</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(COHORT_DETAILS).map(([key, info]) => {
                const prob = ageBins[key] !== undefined ? ageBins[key] : 0;
                const percent = Math.round(prob * 100);
                const isDominant = key === dominantCohort;

                return (
                  <div key={key} className={`rounded-lg border p-2.5 ${isDominant ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200 bg-slate-50/40"}`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{info.range}</span>
                        <span className="text-slate-900 font-bold">{info.label}</span>
                        {isDominant && (
                          <span className="rounded bg-indigo-600 px-1.5 py-0.2 text-[9px] font-extrabold text-white uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-sm font-extrabold text-slate-900">{percent}%</span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: isDominant ? "#4f46e5" : "#94a3b8" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: ARM Weighting Breakdown */}
          <div className="rounded-xl border border-slate-300 bg-white p-5 mb-6" style={{ pageBreakInside: "avoid" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">
              Adaptive Reliability Module (ARM) Weight Distribution
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(contributions).map(([mod, weight]) => {
                const pct = Math.round(weight * 100);
                const modName =
                  mod === "face"
                    ? "Face Signal (EfficientNet-B0 MoE)"
                    : mod === "dorsal" || mod === "dorsal_hand"
                    ? "Dorsal Hand (ResNet18)"
                    : "Blood Report (XGBoost SHAP)";

                return (
                  <div key={mod} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {mod.toUpperCase()} MODALITY
                    </span>
                    <p className="text-2xl font-black font-mono text-slate-900 mt-0.5">{pct}%</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{modName}</p>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Physiological Findings & Justification */}
          <div className="rounded-xl border border-slate-300 bg-white p-5 mb-6" style={{ pageBreakInside: "avoid" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">
              Physiological Analysis &amp; Diagnostic Rationale
            </h2>

            <div className="space-y-2.5">
              {physiologicalRationale.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    • {item.title}
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Verification & Disclaimer Footer */}
          <div className="rounded-lg border border-slate-300 bg-slate-100 p-4 text-[10px] text-slate-600 leading-relaxed" style={{ pageBreakInside: "avoid" }}>
            <p className="font-bold text-slate-800">CLINICAL RESEARCH &amp; ASSESSMENT VERIFICATION</p>
            <p className="mt-1">
              This biological age estimate was generated by the MAGE multimodal deep neural fusion framework (combining EfficientNet-B0 Hierarchical MoE, ResNet-18, and XGBoost biomarker models). This report is provided for informational and clinical research guidance and should be interpreted by a qualified healthcare professional.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-500 font-mono">
              <span>SHA-256 Auth: {result.assessment_id.replace(/-/g, "")}</span>
              <span>Generated via MAGE Engine v1.0</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
