"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";
import { computeArm, fusePredictions, mockModelPredictions } from "@/lib/fusion/mock-pipeline";
import type { ScenarioId } from "@/lib/fusion/mock-pipeline";

interface DataFlowInspectorProps {
  scenario: ScenarioId;
}

type StageId = "model" | "arm" | "fusion";

const stages: { id: StageId; label: string }[] = [
  { id: "model", label: "ModelPrediction" },
  { id: "arm", label: "ARMModelResult" },
  { id: "fusion", label: "FusionResult" },
];

export default function DataFlowInspector({ scenario }: DataFlowInspectorProps) {
  const [active, setActive] = useState<StageId>("model");
  const predictions = useMemo(() => mockModelPredictions[scenario], [scenario]);
  const armResults = useMemo(() => computeArm(predictions), [predictions]);
  const fusionResult = useMemo(() => fusePredictions(predictions, armResults), [predictions, armResults]);

  const payload = useMemo(() => {
    if (active === "model") {
      return predictions.map((prediction) => ({
        model_name: prediction.model_name,
        predicted_age: prediction.predicted_age,
        confidence: prediction.confidence,
        age_bins: prediction.age_bins,
      }));
    }
    if (active === "arm") {
      return armResults.map((arm) => ({
        model_name: arm.model_name,
        reliability: Number(arm.reliability.toFixed(3)),
        evidence_strength: Number(arm.evidence_strength.toFixed(3)),
        confidence_cap: Number(arm.confidence_cap.toFixed(3)),
        weight: Number(arm.weight.toFixed(3)),
      }));
    }
    return {
      fused_predicted_age: fusionResult.fused_predicted_age,
      fused_confidence: Number(fusionResult.fused_confidence.toFixed(3)),
      fused_age_bins: Object.fromEntries(
        Object.entries(fusionResult.fused_age_bins).map(([key, value]) => [key, Number(value.toFixed(3))])
      ),
      model_contributions: Object.fromEntries(
        Object.entries(fusionResult.model_contributions).map(([key, value]) => [key, Number(value.toFixed(1))])
      ),
    };
  }, [active, predictions, armResults, fusionResult]);

  const formatted = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
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
          Data Flow Inspector
        </p>
        <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>
          Inspect the objects as they flow through the pipeline.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setActive(stage.id)}
              className="rounded-xl border px-4 py-3 text-left transition-colors duration-150"
              style={{
                borderColor: active === stage.id ? "#c9b4fa" : "#3f3a52",
                background: active === stage.id ? "rgba(201,180,250,0.12)" : "#000000",
              }}
            >
              <p style={{ color: "#ffffff", fontWeight: 460 }}>{stage.label}</p>
            </button>
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
          {active === "model" ? "ModelPrediction" : active === "arm" ? "ARMModelResult" : "FusionResult"}
        </p>
        <motion.pre
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 overflow-x-auto rounded-lg border p-4 text-sm"
          style={{
            fontFamily: tokens.font.mono,
            lineHeight: 1.7,
            color: "#ffffff",
            borderColor: "#3f3a52",
            background: "#0e0c1f",
          }}
        >
          {formatted}
        </motion.pre>
      </div>
    </div>
  );
}
