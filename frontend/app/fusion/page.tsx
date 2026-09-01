"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/lib/design-tokens";
import ArchitectureDiagram from "@/components/fusion/ArchitectureDiagram";
import ArmFlow from "@/components/fusion/ArmFlow";
import PfmFlow from "@/components/fusion/PfmFlow";
import InteractiveSimulation from "@/components/fusion/InteractiveSimulation";
import DataFlowInspector from "@/components/fusion/DataFlowInspector";
import type { ScenarioId } from "@/lib/fusion/mock-pipeline";

const sections = [
  { id: "architecture", label: "Architecture" },
  { id: "arm", label: "ARM" },
  { id: "pfm", label: "PFM" },
  { id: "simulation", label: "Simulation" },
  { id: "inspector", label: "Inspector" },
] as const;

export default function FusionPage() {
  const [activeSection, setActiveSection] = useState<string>("architecture");
  const [scenario, setScenario] = useState<ScenarioId>("middle");

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="fixed inset-0 z-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" aria-hidden="true" />
      </div>

      <main className="relative z-10 px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p
              className="text-white/70"
              style={{
                fontFamily: tokens.font.mono,
                fontSize: "12px",
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
              }}
            >
              Technical Explorer
            </p>
            <h1
              className="mt-3"
              style={{
                fontFamily: tokens.font.mono,
                fontSize: "48px",
                fontWeight: 460,
                lineHeight: 0.96,
                letterSpacing: "-1.32px",
                color: "#ffffff",
              }}
            >
              Explore Fusion Layer
            </h1>
            <p
              className="mt-5"
              style={{
                fontFamily: tokens.font.mono,
                fontSize: "18px",
                fontWeight: 540,
                lineHeight: 1.5,
                letterSpacing: "-0.135px",
                color: "#bcbac9",
                maxWidth: "72ch",
              }}
            >
              Inspect how MAGE turns model predictions into a single biological-age estimate through ARM reliability
              analysis and PFM fusion. All pipeline values below are deterministic mock data for exploration.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "0px",
                  borderColor: activeSection === item.id ? "#c9b4fa" : "#3f3a52",
                  color: activeSection === item.id ? "#1b1938" : "#bcbac9",
                  background: activeSection === item.id ? "#c9b4fa" : "transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === "architecture" && <ArchitectureDiagram />}
                {activeSection === "arm" && <ArmFlow />}
                {activeSection === "pfm" && <PfmFlow />}
                {activeSection === "simulation" && <InteractiveSimulation scenario={scenario} onScenarioChange={setScenario} />}
                {activeSection === "inspector" && <DataFlowInspector scenario={scenario} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
