"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

type AgeBin = "18-25" | "26-35" | "36-45" | "46+";

const AGE_BINS: AgeBin[] = ["18-25", "26-35", "36-45", "46+"];

export default function AssessmentResultInner() {
  const router = useRouter();
  const params = useSearchParams();
  const assessmentId = params.get("assessment_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    assessment_id: string;
    created_at: string;
    result: {
      fused_predicted_age: number;
      fused_confidence: number;
      fused_age_bins: Record<AgeBin, number>;
      model_contributions: Record<string, number>;
    };
  } | null>(null);

  const chronologicalAge = result?.result ? 24 : null;
  const difference = useMemo(() => {
    if (!result || chronologicalAge === null) return null;
    return Number((result.result.fused_predicted_age - chronologicalAge).toFixed(1));
  }, [result, chronologicalAge]);

  const contributionPercentages = useMemo(() => {
    if (!result) return {};
    const percentages: Record<string, number> = {};
    for (const [model, weight] of Object.entries(result.result.model_contributions)) {
      percentages[model] = Number((weight * 100).toFixed(1));
    }
    return percentages;
  }, [result]);

  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/assessment/${assessmentId}`);
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

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

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

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div
                  className="rounded-xl border p-6"
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
                    Chronological age
                  </p>
                  <p className="mt-2 text-3xl font-medium" style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "32px",
                    fontWeight: 540,
                    lineHeight: 1,
                    letterSpacing: "0px",
                    color: "#ffffff",
                  }}>
                    {chronologicalAge ?? "—"}
                  </p>
                  <p className="mt-2 text-sm" style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 460,
                    lineHeight: 1.4,
                    letterSpacing: "0px",
                    color: "#bcbac9",
                  }}>
                    years
                  </p>
                </div>
                <div
                  className="rounded-xl border p-6"
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
                    Difference
                  </p>
                  <p className="mt-2 text-3xl font-medium" style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "32px",
                    fontWeight: 540,
                    lineHeight: 1,
                    letterSpacing: "0px",
                    color: "#ffffff",
                  }}>
                    {difference !== null ? `${difference > 0 ? "+" : ""}${difference}` : "—"}
                  </p>
                  <p className="mt-2 text-sm" style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 460,
                    lineHeight: 1.4,
                    letterSpacing: "0px",
                    color: "#bcbac9",
                  }}>
                    years
                  </p>
                </div>
              </div>

              <div className="mt-10 rounded-xl border p-6" style={{
                background: "#000000",
                borderColor: "#3f3a52",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
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
                  Model contributions
                </p>
                <div className="mt-4 space-y-3">
                  {AGE_BINS.map((bin) => {
                    const value = result.result.fused_age_bins[bin] ?? 0;
                    return (
                      <div key={bin}>
                        <div className="flex items-center justify-between text-sm" style={{ color: "#bcbac9" }}>
                          <span>{bin}</span>
                          <span>{(value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full" style={{ background: "#3f3a52" }}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(value * 100, 100)}%`, background: "#c9b4fa" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {Object.entries(contributionPercentages).map(([model, pct]) => (
                    <div key={model} className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
                      <p className="text-xs uppercase" style={{ color: "#c9b4fa" }}>{model}</p>
                      <p className="mt-1 text-lg font-medium" style={{ color: "#ffffff" }}>{pct}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
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
                <button
                  type="button"
                  onClick={() => router.push("/history")}
                  className="rounded-full px-6 py-3 text-base font-semibold transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: 1.0,
                    letterSpacing: "0px",
                    background: "#c9b4fa",
                    color: "#1b1938",
                  }}
                >
                  View history
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
