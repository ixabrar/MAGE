"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

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

              <p className="mt-6 text-sm" style={{ color: "#5a5772" }}>
                Dorsal-hand estimate from ResNet18 (128M). For public assessments only the predicted age is shown.
              </p>

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
