"use client";

import { tokens } from "@/lib/design-tokens";

const steps = [
  "Input validation",
  "Modality processing",
  "Feature extraction",
  "Fusion",
  "Estimation",
] as const;

type ProcessingPipelineProps = {
  activeStep: number;
};

export function ProcessingPipeline({ activeStep }: ProcessingPipelineProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const state = index < activeStep ? "done" : index === activeStep ? "active" : "pending";

          return (
            <div
              key={step}
              className="rounded-xl border p-4"
              style={{
                background: "#000000",
                borderColor: state === "active" ? "#c9b4fa" : state === "done" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)",
              }}
            >
              <p
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "11px",
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                  color: tokens.colors.muted,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: state === "pending" ? "rgba(255,255,255,0.45)" : "#ffffff",
                  letterSpacing: "0.5px",
                }}
              >
                {state === "done" ? "✓" : state === "active" ? "●" : "○"} {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
