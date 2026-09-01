"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";
import { FUSION_MIN_MODEL_WEIGHT } from "@/lib/fusion/mock-pipeline";

const steps = [
  {
    title: "Historical Error Records",
    description:
      "Past model errors are tracked by modality and age bin. ARM uses this to estimate how reliable each model has been in similar regions of the input space.",
  },
  {
    title: "Error Profile Builder",
    description:
      "Raw error logs are aggregated into per-model reliability profiles rather than global accuracy scores, so different age regimes can have different reliability estimates.",
  },
  {
    title: "Age-bin Performance",
    description:
      "Reliability is conditioned on the predicted age-bin distribution. A model that performs well overall may still be less reliable in a specific age range.",
  },
  {
    title: "Evidence Strength",
    description:
      "Evidence strength reflects how strongly the current prediction is supported by the input. Stronger evidence raises the allowed reliability ceiling.",
  },
  {
    title: "Evidence-aware Reliability",
    description:
      "Historical reliability is combined with evidence strength. This stage prevents a historically strong model from being trusted when the current input is ambiguous.",
  },
  {
    title: "Confidence-aware Reliability",
    description:
      "The confidence cap limits how much model confidence can improve reliability: confidence_cap = 0.5 + 0.5 × confidence. Low confidence keeps the ceiling low.",
  },
  {
    title: "Gating Network",
    description:
      "Final reliability is converted into a dynamic weight. Weights are normalized to sum to 1 and each model receives at least MIN_MODEL_WEIGHT.",
  },
  {
    title: "Dynamic Weights",
    description:
      "ARM outputs one weight per active model. These weights replace fixed ensemble coefficients and change per-assessment based on current predictions.",
  },
];

export default function ArmFlow() {
  const [mode, setMode] = useState<"formula" | "conceptual">("formula");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000000" }}>
        <h2
          className="text-xl font-medium"
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "22px",
            fontWeight: 460,
            lineHeight: 1.1,
            letterSpacing: "-0.315px",
            color: "#ffffff",
          }}
        >
          ARM internals
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>
          Hover or read the chain from top to bottom.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-2">
              <div
                className="flex items-center gap-3"
                style={{
                  borderLeft: "2px solid #3f3a52",
                  paddingLeft: "14px",
                }}
              >
                <div>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: tokens.font.mono,
                      fontSize: "12px",
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: "1.8px",
                      textTransform: "uppercase",
                      color: "#c9b4fa",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: tokens.font.mono,
                      fontSize: "16px",
                      fontWeight: 460,
                      lineHeight: 1.3,
                      color: "#ffffff",
                    }}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="pl-7">
                  <span style={{ color: "#5a5772", fontSize: "12px" }}>↓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000000" }}>
          <div className="flex flex-wrap items-center gap-2">
            {(["formula", "conceptual"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "0px",
                  borderColor: mode === item ? "#c9b4fa" : "#3f3a52",
                  color: mode === item ? "#1b1938" : "#bcbac9",
                  background: mode === item ? "#c9b4fa" : "transparent",
                }}
              >
                {item === "formula" ? "Formula" : "Conceptual"}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {mode === "formula" ? (
              <div className="space-y-4">
                <p
                  className="text-sm"
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#ffffff",
                  }}
                >
                  confidence_cap = 0.5 + 0.5 × confidence
                </p>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#ffffff",
                  }}
                >
                  final_reliability = min(historical_reliability, confidence_cap)
                </p>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#ffffff",
                  }}
                >
                  raw_weight_i = reliability_i × evidence_strength_i
                </p>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#ffffff",
                  }}
                >
                  weight_i = clamp(raw_weight_i, MIN_MODEL_WEIGHT, 1)
                </p>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#ffffff",
                  }}
                >
                  normalized_weight_i = weight_i / Σ weights
                </p>
                <p className="text-sm" style={{ color: "#bcbac9" }}>
                  Current MIN_MODEL_WEIGHT = {FUSION_MIN_MODEL_WEIGHT}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p style={{ color: "#ffffff", lineHeight: 1.7 }}>
                  High confidence increases the reliability ceiling, so historically strong models can still dominate when the
                  current prediction is trustworthy.
                </p>
                <p style={{ color: "#bcbac9", lineHeight: 1.7 }}>
                  Low confidence keeps the ceiling low, tempering strong historical models when the current input is ambiguous.
                </p>
                <p style={{ color: "#bcbac9", lineHeight: 1.7 }}>
                  If historical reliability is already ≤ 0.5, confidence does not artificially improve it.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000000" }}>
          <p
            className="text-sm"
            style={{
              fontFamily: tokens.font.mono,
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              color: "#c9b4fa",
            }}
          >
            Technical Guarantees
          </p>
          <ul className="mt-4 grid gap-2 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
            <li>✓ Dynamic model weighting</li>
            <li>✓ No fixed model weights</li>
            <li>✓ Weights sum to 1.0</li>
            <li>✓ Minimum model weight enforced</li>
            <li>✓ Negative reliability rejected</li>
            <li>✓ Confidence-aware reliability</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
