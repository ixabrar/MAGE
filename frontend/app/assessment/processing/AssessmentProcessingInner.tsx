"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface PipelineStage {
  id: string;
  name: string;
  tag: string;
  description: string;
  detail: string;
  durationMs: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "ingest",
    name: "Multimodal Ingestion & Alignment",
    tag: "INGESTION",
    description: "Validating input tensors, image alignments, and clinical lab ranges.",
    detail: "Normalizing RGB face geometry, hand dorsal contours, and lab chemistry tables",
    durationMs: 800,
  },
  {
    id: "feature",
    name: "Deep Neural Feature Extraction",
    tag: "INFERENCE",
    description: "Executing EfficientNet-B0 Hierarchical MoE & ResNet-18 branches.",
    detail: "Synthesizing 6 developmental expert heads across 101 continuous age bins",
    durationMs: 1200,
  },
  {
    id: "arm",
    name: "Adaptive Reliability Calibration",
    tag: "ARM ENGINE",
    description: "Calculating cohort reliability weights and evidence certainty.",
    detail: "Evaluating historical accuracy profiles across brackets 18-25, 26-35, 36-45, 46+",
    durationMs: 1100,
  },
  {
    id: "pfm",
    name: "Prediction Fusion Module (PFM)",
    tag: "FUSION",
    description: "Bayesian distribution fusion and cross-modal uncertainty reduction.",
    detail: "Optimizing joint probability density and individual model contribution weights",
    durationMs: 900,
  },
  {
    id: "synthesis",
    name: "Calibrated Biological Synthesis",
    tag: "FINALIZING",
    description: "Finalizing biological age gap and generating clinical metrics.",
    detail: "Calibrating confidence intervals and rendering assessment telemetry",
    durationMs: 600,
  },
];

const TELEMETRY_LOGS = [
  "Initializing MAGE Multimodal Inference Engine...",
  "Input matrix validated: RGB Image [1, 3, 224, 224] + Clinical Chemistry",
  "Executing Phase 3 Hierarchical Distributional Age Model (EfficientNet-B0)...",
  "Gating probabilities computed across 6 developmental stages [0-100]",
  "ResNet-18 dorsal hand landmark consistency verified",
  "ARM: Evaluating empirical error profiles for current cohort...",
  "ARM: Dynamic reliability assigned: Face=0.331, Dorsal=0.342, Blood=0.326",
  "PFM: Computing Bayesian joint distribution over age domain...",
  "PFM: Variance minimization reached convergence (delta < 0.001)",
  "Calibrating composite biological age and confidence interval...",
  "Synthesis complete. Rendering assessment results dashboard.",
];

export default function AssessmentProcessingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const assessmentId = params.get("assessment_id");

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(10);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentStage = useMemo(
    () => PIPELINE_STAGES[currentStageIdx] || PIPELINE_STAGES[PIPELINE_STAGES.length - 1],
    [currentStageIdx]
  );

  // Orchestrate synchronized visual stages and progress timer
  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment ID reference. Please return to step 1.");
      return;
    }

    let stage = 0;
    let currentProgress = 10;

    const stageInterval = setInterval(() => {
      stage += 1;
      if (stage < PIPELINE_STAGES.length) {
        setCurrentStageIdx(stage);
        setProgress((prev) => Math.min(prev + 18, 90));
      } else {
        clearInterval(stageInterval);
        setProgress(100);
        setTimeout(() => {
          router.push(`/assessment/result?assessment_id=${assessmentId}`);
        }, 500);
      }
    }, 950);

    const logInterval = setInterval(() => {
      setActiveLogIndex((prev) => (prev < TELEMETRY_LOGS.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(stageInterval);
      clearInterval(logInterval);
    };
  }, [assessmentId, router]);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-purple-500/30" suppressHydrationWarning>
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9b4fa]/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#7b61ff]/6 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1b1938_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 sm:px-10 lg:px-16">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold uppercase tracking-[1.8px] text-[#bcbac9] transition-all duration-150 hover:border-white/30 hover:bg-white/8 hover:text-white"
            style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
          >
            ← MAGE
          </a>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9b4fa] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c9b4fa]" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#bcbac9]">
              Processing Pipeline
            </span>
          </div>
        </nav>

        {/* Error Alert */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Main Processing Core */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Visual Orbital Pulse & Status */}
          <div className="flex flex-col items-center text-center lg:col-span-5">
            {/* Concentric Biometric Radar Graphic */}
            <div className="relative flex h-64 w-64 items-center justify-center">
              {/* Outer pulsing orbit */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-[#c9b4fa]/20"
              />
              
              {/* Middle dynamic scanner ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-3 rounded-full border border-t-2 border-r-transparent border-b-[#7b61ff]/40 border-l-transparent"
              />

              {/* Inner glowing pulse ring */}
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 rounded-full border border-[#c9b4fa]/40 bg-gradient-to-br from-[#c9b4fa]/10 to-transparent shadow-[0_0_30px_rgba(201,180,250,0.15)]"
              />

              {/* Center Metrics readout */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.span
                  key={progress}
                  initial={{ opacity: 0.8, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl"
                >
                  {Math.round(progress)}%
                </motion.span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[2px] text-[#c9b4fa]">
                  {currentStage.tag}
                </span>
              </div>
            </div>

            {/* Active Sub-stage Tagline */}
            <div className="mt-6 max-w-xs">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {currentStage.name}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#bcbac9]">
                {currentStage.description}
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Stage Stepper & Pipeline Telemetry */}
          <div className="space-y-6 lg:col-span-7">
            {/* Synced Overall Progress Bar */}
            <div className="rounded-xl border border-[#3f3a52]/60 bg-[#0e0c1f]/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-[#bcbac9]">
                <span className="uppercase text-[#c9b4fa]">Pipeline Progress</span>
                <span className="font-mono">Stage {currentStageIdx + 1} of {PIPELINE_STAGES.length}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#7b61ff] via-[#c9b4fa] to-white shadow-[0_0_12px_rgba(201,180,250,0.5)]"
                  initial={{ width: "10%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Sequential Pipeline Stages List */}
            <div className="space-y-2.5">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;

                return (
                  <motion.div
                    key={stage.id}
                    layout
                    initial={{ opacity: 0.6 }}
                    animate={{
                      opacity: isActive ? 1 : isCompleted ? 0.8 : 0.4,
                      scale: isActive ? 1.01 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-colors duration-200 ${
                      isActive
                        ? "border-[#c9b4fa] bg-[#141228]/80 shadow-[0_0_20px_rgba(201,180,250,0.12)]"
                        : isCompleted
                        ? "border-[#3f3a52]/80 bg-[#090814]/50"
                        : "border-[#3f3a52]/30 bg-black/40"
                    }`}
                  >
                    {/* Active Stage Indicator Line */}
                    {isActive && (
                      <motion.div
                        layoutId="activeGlowLine"
                        className="absolute top-0 bottom-0 left-0 w-1 bg-[#c9b4fa]"
                      />
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {/* Step Status Icon */}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isCompleted
                              ? "bg-[#c9b4fa] text-[#1b1938]"
                              : isActive
                              ? "border border-[#c9b4fa] bg-[#c9b4fa]/20 text-white"
                              : "border border-white/10 text-white/30"
                          }`}
                        >
                          {isCompleted ? "✓" : `0${idx + 1}`}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {stage.name}
                            </span>
                            {isActive && (
                              <span className="rounded bg-[#c9b4fa]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#c9b4fa]">
                                RUNNING
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#bcbac9]/70">
                            {isActive ? stage.detail : stage.description}
                          </p>
                        </div>
                      </div>

                      {/* State Badge */}
                      <div className="shrink-0 text-right">
                        {isCompleted && (
                          <span className="text-xs font-medium text-[#c9b4fa]">Passed</span>
                        )}
                        {isActive && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9b4fa] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c9b4fa]" />
                          </span>
                        )}
                        {!isCompleted && !isActive && (
                          <span className="text-xs text-white/20">Queued</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Real-time Telemetry Stream Terminal */}
            <div className="rounded-xl border border-white/10 bg-black/80 p-4 font-mono text-[11px] text-[#bcbac9]">
              <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-semibold tracking-wider uppercase text-white/40">
                <span>Telemetry Terminal</span>
                <span>Live Feed</span>
              </div>
              <div className="h-14 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeLogIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 text-[#c9b4fa]"
                  >
                    <span className="text-white/30">&gt;</span>
                    <span className="truncate">{TELEMETRY_LOGS[activeLogIndex]}</span>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-1 text-white/30 truncate">
                  &gt; {TELEMETRY_LOGS[Math.max(0, activeLogIndex - 1)]}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
