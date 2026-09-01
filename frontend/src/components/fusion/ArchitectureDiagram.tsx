"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";

type NodeId = "input" | "model" | "arm" | "pfm" | "output";

interface NodeMeta {
  id: NodeId;
  label: string;
  description: string;
}

const nodes: NodeMeta[] = [
  {
    id: "input",
    label: "Input Layer",
    description:
      "User-provided biological inputs: face image, dorsal-hand image, and/or blood report. Missing modalities are allowed and masked downstream.",
  },
  {
    id: "model",
    label: "Model Layer",
    description:
      "Each modality encoder produces a ModelPrediction: predicted_age, confidence, and age-bin probabilities. Models run independently.",
  },
  {
    id: "arm",
    label: "ARM",
    description:
      "Adaptive Reliability Module. Evaluates historical reliability, evidence strength, confidence cap, and emits dynamic model weights.",
  },
  {
    id: "pfm",
    label: "PFM",
    description:
      "Prediction Fusion Module. Fuses weighted age predictions, probability distributions, and confidences into a single FusionResult.",
  },
  {
    id: "output",
    label: "Fused Output",
    description:
      "Final biological-age estimate, fused confidence, age-bin distribution, and per-model contributions.",
  },
];

const edges: { from: NodeId; to: NodeId }[] = [
  { from: "input", to: "model" },
  { from: "model", to: "arm" },
  { from: "arm", to: "pfm" },
  { from: "pfm", to: "output" },
];

export default function ArchitectureDiagram() {
  const [selected, setSelected] = useState<NodeId | null>(null);
  const active = nodes.find((node) => node.id === selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
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
          High-level architecture
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#bcbac9" }}>
          Click a layer to inspect its responsibility.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex flex-col gap-3">
              <motion.button
                onClick={() => setSelected(node.id)}
                className="flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors duration-150"
                style={{
                  borderColor: selected === node.id ? "#c9b4fa" : "#3f3a52",
                  background: selected === node.id ? "rgba(201,180,250,0.12)" : "#000000",
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
                    className="mt-2"
                    style={{
                      fontFamily: tokens.font.mono,
                      fontSize: "18px",
                      fontWeight: 460,
                      lineHeight: 1.2,
                      letterSpacing: "0px",
                      color: "#ffffff",
                    }}
                  >
                    {node.label}
                  </p>
                </div>
                <span
                  className="text-sm"
                  style={{ color: selected === node.id ? "#ffffff" : "#5a5772" }}
                >
                  {selected === node.id ? "Selected" : "Inspect"}
                </span>
              </motion.button>

              {index < nodes.length - 1 && (
                <div className="flex items-center gap-3 pl-6">
                  <div className="h-px flex-1 bg-white/10" />
                  <span style={{ color: "#5a5772", fontSize: "12px" }}>↓</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              )}
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
          Layer Inspector
        </p>
        {active ? (
          <div className="mt-4">
            <h3
              className="text-2xl font-medium"
              style={{
                fontFamily: tokens.font.mono,
                fontSize: "26px",
                fontWeight: 540,
                lineHeight: 1.1,
                letterSpacing: "0px",
                color: "#ffffff",
              }}
            >
              {active.label}
            </h3>
            <p className="mt-3" style={{ color: "#bcbac9", lineHeight: 1.6 }}>
              {active.description}
            </p>
          </div>
        ) : (
          <p className="mt-4" style={{ color: "#5a5772" }}>
            Select a layer to view its role in the fusion pipeline.
          </p>
        )}
      </div>
    </div>
  );
}
