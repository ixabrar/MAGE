"use client";

import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";
import { fusePredictions, FUSION_MIN_MODEL_WEIGHT } from "@/lib/fusion/mock-pipeline";

const formulas = [
  {
    title: "Fused Age",
    code: "fused_age = Σ(weight_i × predicted_age_i)",
    description:
      "Each model’s predicted age is multiplied by its ARM weight, then summed into one global estimate.",
  },
  {
    title: "Fused Age-bin Distribution",
    code: "raw_bin[b] = Σ(weight_i × probability_i[b])\nfused_bin[b] = raw_bin[b] / Σ raw_bin",
    description:
      "Per-bin probabilities are blended with the same weights, then renormalized into a valid distribution.",
  },
  {
    title: "Fused Confidence",
    code: "fused_confidence = Σ(weight_i × confidence_i)",
    description:
      "Confidence is weighted rather than averaged, so more reliable models contribute more to the final certainty score.",
  },
];

export default function PfmFlow() {
  const mockPredictions = [
    {
      model_name: "dorsal",
      predicted_age: 34.0,
      confidence: 0.70,
      age_bins: { "18-25": 0.10, "26-35": 0.70, "36-45": 0.15, "46+": 0.05 },
    },
    {
      model_name: "face",
      predicted_age: 36.4,
      confidence: 0.64,
      age_bins: { "18-25": 0.06, "26-35": 0.58, "36-45": 0.26, "46+": 0.10 },
    },
    {
      model_name: "blood",
      predicted_age: 33.2,
      confidence: 0.73,
      age_bins: { "18-25": 0.12, "26-35": 0.68, "36-45": 0.14, "46+": 0.06 },
    },
  ];

  const armResults = [
    { model_name: "dorsal", historical_reliability: 0.82, evidence_strength: 0.78, confidence_cap: 0.85, reliability: 0.76, weight: 0.345 },
    { model_name: "face", historical_reliability: 0.78, evidence_strength: 0.74, confidence_cap: 0.82, reliability: 0.70, weight: 0.315 },
    { model_name: "blood", historical_reliability: 0.74, evidence_strength: 0.80, confidence_cap: 0.86, reliability: 0.74, weight: 0.340 },
  ];

  const fusionResult = fusePredictions(mockPredictions, armResults);

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
          PFM internals
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>
          Prediction Fusion Module combines ARM-weighted model outputs into one result.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {[
            {
              label: "Input",
              text: "ARMModelResult[] + ModelPrediction[]",
            },
            {
              label: "Weighted Fusion",
              text: "Age, probability, and confidence are each fused with the same ARM weights.",
            },
            {
              label: "Normalization",
              text: "Age-bin probabilities are renormalized so they remain a valid distribution.",
            },
            {
              label: "Output",
              text: "FusionResult with fused age, confidence, bins, and model contributions.",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="flex items-start gap-4 rounded-xl border p-4"
              style={{ borderColor: "#3f3a52", background: "#000000" }}
            >
              <span
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
              </span>
              <div>
                <p style={{ color: "#ffffff", fontWeight: 460 }}>{item.label}</p>
                <p className="mt-1 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
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
            Formulas
          </p>
          <div className="mt-4 space-y-4">
            {formulas.map((item) => (
              <div key={item.title} className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                <p style={{ color: "#ffffff", fontWeight: 460 }}>{item.title}</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "#ffffff", lineHeight: 1.7 }}>
                  {item.code}
                </pre>
                <p className="mt-2 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
                  {item.description}
                </p>
              </div>
            ))}
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
            Mock Result
          </p>
          <div className="mt-4 grid gap-3 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
            <div>
              <span style={{ color: "#ffffff" }}>Fused age: </span>
              {fusionResult.fused_predicted_age}
            </div>
            <div>
              <span style={{ color: "#ffffff" }}>Fused confidence: </span>
              {fusionResult.fused_confidence}
            </div>
            <div>
              <span style={{ color: "#ffffff" }}>Dominant bin: </span>
              {Object.entries(fusionResult.fused_age_bins)
                .sort((a, b) => b[1] - a[1])[0]?.[0]}
            </div>
            <div>
              <span style={{ color: "#ffffff" }}>Weights: </span>
              {armResults.map((arm) => `${arm.model_name}=${Math.round(arm.weight * 100)}%`).join(", ")}
            </div>
            <div>
              <span style={{ color: "#ffffff" }}>MIN_MODEL_WEIGHT: </span>
              {FUSION_MIN_MODEL_WEIGHT}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
