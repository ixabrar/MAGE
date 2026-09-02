"use client";

import { motion } from "framer-motion";

export default function FusionLayer() {
  return (
    <section id="fusion-layer" className="py-16 sm:py-20 bg-black" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-2xl border p-6 sm:p-8" style={{ background: "#0e0c1f", borderColor: "#1e1c2a" }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: "#c9b4fa" }}>Fusion layer • ARM → PFM</p>
              <h2 className="mt-2 text-xl font-semibold" style={{ color: "#fff" }}>Only what you provide.</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "#bcbac9" }}>
                Missing modality = masked, not guessed. Face & Hand are weighted by reliability, then averaged.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "#3f3a52", background: "#000", color: "#bcbac9" }}>Face</span>
              <span style={{ color: "#5a5772" }}>+</span>
              <span className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "#3f3a52", background: "#000", color: "#bcbac9" }}>Hand</span>
              <span style={{ color: "#c9b4fa" }}>→</span>
              <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>Age</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs" style={{ color: "#5a5772" }}>
            <span className="rounded bg-white/5 px-2 py-1 font-mono" style={{ color: "#c9b4fa" }}>ResNet18 128M</span>
            <span className="rounded bg-white/5 px-2 py-1 font-mono" style={{ color: "#c9b4fa" }}>XGBoost (doctor)</span>
            <span>Public = single • Doctor = multimodal + blood</span>
          </div>
        </div>
      </div>
    </section>
  );
}
