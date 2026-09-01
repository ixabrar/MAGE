"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";
import { computeArm, fusePredictions, mockModelPredictions, FUSION_MIN_MODEL_WEIGHT } from "@/lib/fusion/mock-pipeline";
import type { ScenarioId } from "@/lib/fusion/mock-pipeline";

interface InteractiveSimulationProps {
  scenario: ScenarioId;
  onScenarioChange: (scenario: ScenarioId) => void;
}

export default function InteractiveSimulation({ scenario, onScenarioChange }: InteractiveSimulationProps) {
  const predictions = useMemo(() => mockModelPredictions[scenario], [scenario]);
  const armResults = useMemo(() => computeArm(predictions), [predictions]);
  const fusionResult = useMemo(() => fusePredictions(predictions, armResults), [predictions, armResults]);

  return (
    <div className="grid gap-6">
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
          Interactive Fusion Simulation
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>
          Choose a scenario and inspect how model predictions, ARM weights, and fused output change together.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["young", "middle", "old"] as ScenarioId[]).map((item) => (
            <button
              key={item}
              onClick={() => onScenarioChange(item)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
              style={{
                fontFamily: tokens.font.mono,
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "0px",
                borderColor: scenario === item ? "#c9b4fa" : "#3f3a52",
                color: scenario === item ? "#1b1938" : "#bcbac9",
                background: scenario === item ? "#c9b4fa" : "transparent",
              }}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            Model Predictions
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ color: "#ffffff" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                  <th className="px-4 py-3" style={{ color: "#c9b4fa" }}>Model</th>
                  <th className="px-4 py-3" style={{ color: "#c9b4fa" }}>Age</th>
                  <th className="px-4 py-3" style={{ color: "#c9b4fa" }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((item) => (
                  <tr key={item.model_name} style={{ borderBottom: "1px solid #3f3a52" }}>
                    <td className="px-4 py-3" style={{ color: "#bcbac9", textTransform: "capitalize" }}>{item.model_name}</td>
                    <td className="px-4 py-3">{item.predicted_age}</td>
                    <td className="px-4 py-3">{item.confidence.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            ARM Output
          </p>
          <div className="mt-4 space-y-3 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
            {armResults.map((arm) => (
              <div key={arm.model_name} className="rounded-lg border p-3" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                <p style={{ color: "#ffffff", textTransform: "capitalize" }}>{arm.model_name}</p>
                <p>Reliability: {arm.reliability.toFixed(3)}</p>
                <p>Evidence strength: {arm.evidence_strength.toFixed(3)}</p>
                <p>Weight: {(arm.weight * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
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
          PFM Output
        </p>
        <div className="mt-4 grid gap-3 text-sm" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
          <div>
            <span style={{ color: "#ffffff" }}>Fused age: </span>
            {fusionResult.fused_predicted_age}
          </div>
          <div>
            <span style={{ color: "#ffffff" }}>Fused confidence: </span>
            {fusionResult.fused_confidence.toFixed(3)}
          </div>
          <div>
            <span style={{ color: "#ffffff" }}>Dominant bin: </span>
            {Object.entries(fusionResult.fused_age_bins).sort((a, b) => b[1] - a[1])[0]?.[0]}
          </div>
          <div>
            <span style={{ color: "#ffffff" }}>Model contributions: </span>
            {Object.entries(fusionResult.model_contributions)
              .map(([key, value]) => `${key}=${value}%`)
              .join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}
