"use client";

import { useState } from "react";
import { ModalitySelector } from "@/components/assessment/ModalitySelector";
import { ProcessingPipeline } from "@/components/assessment/ProcessingPipeline";
import { FaceCapture } from "@/components/modalities/FaceCapture";
import { HandCapture } from "@/components/modalities/HandCapture";
import { BloodUpload } from "@/components/modalities/BloodUpload";
import { tokens } from "@/lib/design-tokens";
import type { Modality } from "@/types";

export function AssessmentPageClient() {
  const [selected, setSelected] = useState<Modality[]>(["face", "dorsal_hand", "blood"]);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const canContinue = selected.length > 0;

  return (
    <div className="space-y-10">
      <div>
        <p
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "12px",
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: tokens.colors.muted,
          }}
        >
          New assessment
        </p>
        <h1
          className="mt-3 text-white"
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          What would you like to use?
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "15px",
            lineHeight: 1.6,
            color: tokens.colors.muted,
            maxWidth: "72ch",
          }}
        >
          Choose any supported combination. The backend activates only the selected modality models and
          routes their representations into the fusion layer.
        </p>
      </div>

      <ModalitySelector selected={selected} onChange={setSelected} />

      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={!canContinue}
          onClick={() => setSubmitted(true)}
          className="rounded-md border border-white/35 px-6 py-3 text-white transition-colors duration-150 hover:border-white hover:bg-white/6 disabled:opacity-40"
          style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}
        >
          Continue
        </button>
        <span
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "13px",
            color: tokens.colors.muted,
            letterSpacing: "0.5px",
          }}
        >
          {selected.length} selected
        </span>
      </div>

      {submitted ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            {selected.includes("face") ? <FaceCapture key="face" /> : null}
            {selected.includes("dorsal_hand") ? <HandCapture key="dorsal_hand" /> : null}
            {selected.includes("blood") ? <BloodUpload key="blood" /> : null}
          </div>

          <ProcessingPipeline activeStep={step} />

          <div className="flex flex-wrap gap-3">
            {step < 4 ? (
              <button
                onClick={() => setStep((current) => current + 1)}
                className="rounded-md bg-white px-6 py-3 text-black transition-colors duration-150 hover:bg-[#f0f0f0]"
                style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}
              >
                Advance pipeline
              </button>
            ) : (
              <a
                href="/assessment/result"
                className="inline-flex items-center rounded-md bg-white px-6 py-3 text-black transition-colors duration-150 hover:bg-[#f0f0f0]"
                style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}
              >
                View result
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
