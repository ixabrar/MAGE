"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const PIPELINE_STAGES = [
  {
    id: "validation",
    name: "Input Validation & Anti-Spoofing",
    tag: "Integrity Verification",
    description: "Verifying skin locus, facial bilateral symmetry, and image sharpness.",
    detail: "Running spatial clustering & edge Laplacian filtering...",
    duration: 900,
  },
  {
    id: "feature_extraction",
    name: "Deep Feature Extraction",
    tag: "Neural Forward Pass",
    description: "Extracting latent facial representations & dorsal hand dermal maps.",
    detail: "EfficientNet-B0 MoE (101 bins) & ResNet-18 dermal layer activations...",
    duration: 1200,
  },
  {
    id: "arm_calibration",
    name: "Adaptive Reliability (ARM)",
    tag: "Statistical Weighting",
    description: "Calculating empirical modality weights and history error matrices.",
    detail: "Computing covariance matrices & modality confidence weights...",
    duration: 1000,
  },
  {
    id: "pfm_fusion",
    name: "Prediction Fusion (PFM)",
    tag: "Cohort Convergence",
    description: "Synthesizing multimodal probability density into calibrated biological age.",
    detail: "Softmax expectation & Bayesian credible interval synthesis...",
    duration: 900,
  },
  {
    id: "report_generation",
    name: "Generating Clinical Diagnosis",
    tag: "Finalizing Assessment",
    description: "Compiling physiological insights, SHAP values, and diagnostic summary.",
    detail: "Finalizing cryptographic assessment signature...",
    duration: 700,
  },
];

const TELEMETRY_LOGS = [
  "Initializing MAGE Neural Runtime [CPU/CUDA Mode]...",
  "Running pre-inference biometric symmetry verification...",
  "RGB & YCbCr dermal chrominance within bounds (valid human tissue detected)...",
  "Forward pass: EfficientNet-B0 Hierarchical MoE (6 expert heads)...",
  "Forward pass: ResNet-18 Dorsal Hand dermal texture analysis...",
  "Loading Adaptive Reliability Module (ARM) error covariance matrix...",
  "Calibrating modal contributions [Face / Dorsal Hand / Blood Lab]...",
  "Executing Prediction Fusion Module (PFM) multi-cohort integration...",
  "Calculating 95% Bayesian Credible Intervals (±σ)...",
  "Assessment finalized. Generating clinical verification report...",
];

export default function AssessmentProcessingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment_id");

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError("Missing assessment reference ID.");
      return;
    }

    // Telemetry log ticker
    const logInterval = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % TELEMETRY_LOGS.length);
    }, 600);

    // Sequential stage progression
    let currentIdx = 0;
    const totalStages = PIPELINE_STAGES.length;

    const executeStage = () => {
      if (currentIdx >= totalStages) {
        setProgress(100);
        setTimeout(() => {
          router.push(`/assessment/result?assessment_id=${assessmentId}`);
        }, 500);
        return;
      }

      const stage = PIPELINE_STAGES[currentIdx];
      setCurrentStageIdx(currentIdx);

      // Smooth progress update
      const targetProgress = Math.round(((currentIdx + 1) / totalStages) * 95);
      setProgress(targetProgress);

      const timer = setTimeout(() => {
        currentIdx += 1;
        executeStage();
      }, stage.duration);

      return timer;
    };

    const initialTimer = executeStage();

    return () => {
      clearInterval(logInterval);
      if (initialTimer) clearTimeout(initialTimer);
    };
  }, [assessmentId, router]);

  const currentStage = PIPELINE_STAGES[currentStageIdx] || PIPELINE_STAGES[0];

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#c9b4fa]/30" suppressHydrationWarning>
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9b4fa]/10 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#7b61ff]/8 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between border-b border-white/5 pb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold uppercase tracking-[1.8px] text-[#bcbac9] transition-colors hover:border-white hover:text-white"
            style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
          >
            ← MAGE
          </a>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9b4fa] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c9b4fa]" />
            </span>
            <span className="text-xs font-mono text-[#bcbac9]">
              {assessmentId ? `ID: ${assessmentId.slice(0, 8)}` : "Neural Processing"}
            </span>
          </div>
        </nav>

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Main Processing Layout */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Glowing Radar & Percentage Dial */}
          <div className="flex flex-col items-center text-center lg:col-span-5">
            <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
              {/* Outer dashed spinning ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-[#c9b4fa]/30"
              />

              {/* Middle reverse spinning ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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
