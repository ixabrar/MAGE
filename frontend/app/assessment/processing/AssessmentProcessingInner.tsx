"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const stages = [
  { key: "validation", label: "Input validation" },
  { key: "processing", label: "Modality processing" },
  { key: "feature", label: "Feature extraction" },
  { key: "fusion", label: "Fusion" },
  { key: "estimation", label: "Estimation" },
] as const;

type StageKey = (typeof stages)[number]["key"];

const stageOrder: StageKey[] = ["validation", "processing", "feature", "fusion", "estimation"];

export default function AssessmentProcessingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [current, setCurrent] = useState<StageKey>("validation");
  const [error, setError] = useState<string | null>(null);

  const assessmentId = params.get("assessment_id");

  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment ID");
      return;
    }

    const timings: Record<StageKey, number> = {
      validation: 600,
      processing: 900,
      feature: 1100,
      fusion: 900,
      estimation: 700,
    };

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      if (index >= stageOrder.length) {
        clearInterval(interval);
        setTimeout(() => router.push(`/assessment/result?assessment_id=${assessmentId}`), 300);
      } else {
        setCurrent(stageOrder[index]);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [router, assessmentId]);

  const currentIndex = stageOrder.indexOf(current);

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
            Step 3 of 3
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
            Processing assessment
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
            MAGE is running the selected modality branches through the fusion layer. This demo UI mirrors
            the real backend pipeline stages.
          </p>

          {error && (
            <p className="mt-4 text-sm" style={{ color: "#ff8a8a" }}>
              {error}
            </p>
          )}

          <div className="mt-10 space-y-4">
            {stages.map((stage, index) => {
              const isComplete = index < currentIndex;
              const isActive = stage.key === current;
              return (
                <div
                  key={stage.key}
                  className="rounded-xl border p-5"
                  style={{
                    background: "#000000",
                    borderColor: isActive ? "#c9b4fa" : "#3f3a52",
                    boxShadow: isActive ? "0 0 0 1px rgba(201,180,250,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                          lineHeight: 1.0,
                          letterSpacing: "1.8px",
                          textTransform: "uppercase",
                          color: isActive ? "#c9b4fa" : "#5a5772",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p
                        className="mt-2 text-base font-medium"
                        style={{
                          fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                          fontSize: "16px",
                          fontWeight: 460,
                          lineHeight: 1.4,
                          letterSpacing: "0px",
                          color: "#ffffff",
                        }}
                      >
                        {stage.label}
                      </p>
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color: isComplete ? "#c9b4fa" : isActive ? "#ffffff" : "#5a5772",
                      }}
                    >
                      {isComplete ? "✓" : isActive ? "…" : "○"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
