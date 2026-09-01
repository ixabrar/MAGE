"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const steps = [
  { key: "face", label: "Face", hint: "Camera / Upload" },
  { key: "dorsal_hand", label: "Dorsal Hand", hint: "Camera / Upload" },
  { key: "blood", label: "Blood", hint: "PDF / Image" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const modalityMeta: Record<StepKey, { title: string; accept: string; helper: string }> = {
  face: {
    title: "Face input",
    accept: "image/*",
    helper: "Upload a clear frontal face image or use the camera placeholder.",
  },
  dorsal_hand: {
    title: "Dorsal hand input",
    accept: "image/*",
    helper: "Upload a dorsal-hand image or use the camera placeholder.",
  },
  blood: {
    title: "Blood input",
    accept: ".pdf,image/*",
    helper: "Upload a PDF report or image of blood-derived values.",
  },
};

function AssessmentUploadInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [activeStep, setActiveStep] = useState<StepKey>("face");
  const [files, setFiles] = useState<Record<StepKey, File | null>>({
    face: null,
    dorsal_hand: null,
    blood: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAssessmentId, setSubmittedAssessmentId] = useState<string | null>(null);

  const handleChange = (step: StepKey, file: File | null) => {
    setFiles((current) => ({ ...current, [step]: file }));
  };

  const handleBack = () => {
    setSubmitted(false);
    setSubmittedAssessmentId(null);
    router.push("/assessment");
  };

  const selectedParam = params.get("selected");
  const selected: StepKey[] = useMemo(() => {
    if (!selectedParam) return ["face", "dorsal_hand", "blood"];
    return selectedParam
      .split(",")
      .filter((value): value is StepKey => steps.some((step) => step.key === value));
  }, [selectedParam]);

  const availableSteps = steps.filter((step) => selected.includes(step.key));

  useEffect(() => {
    if (availableSteps.length === 0) {
      setActiveStep("face");
      return;
    }
    const currentStillValid = availableSteps.some((step) => step.key === activeStep);
    if (!currentStillValid) {
      setActiveStep(availableSteps[0].key);
    }
  }, [selected, activeStep, availableSteps]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const modalities = availableSteps.map((step) => step.key);
      const inputs: Record<string, { type: string; file_url: string | null }> = {};

      for (const step of availableSteps) {
        const file = files[step.key];
        inputs[step.key] = {
          type: step.key === "blood" ? "pdf_or_image" : "image",
          file_url: file ? file.name : null,
        };
      }

      const payload = {
        modalities,
        inputs,
        context: {},
      };

      const response = await fetch("http://127.0.0.1:8000/api/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Assessment submission failed");
      }

      const data = await response.json();
      setSubmittedAssessmentId(data.assessment_id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <nav className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold uppercase transition-colors duration-150 hover:border-white hover:bg-white/6"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "1.8px",
              color: "#bcbac9",
            }}
          >
            ← MAGE
          </a>
          <div className="text-sm" style={{ color: "#5a5772" }}>
            {submitted ? "Submitted" : "Step 2 of 3"}
          </div>
        </nav>

        <div className="mt-16 max-w-2xl">
          <h1
            className="text-4xl font-medium tracking-tight"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              fontSize: "48px",
              fontWeight: 460,
              lineHeight: 0.96,
              letterSpacing: "-1.32px",
              color: "#ffffff",
            }}
          >
            Upload inputs
          </h1>
          <p className="mt-6 text-lg" style={{
            fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
            fontSize: "18px",
            fontWeight: 540,
            lineHeight: 1.5,
            letterSpacing: "-0.135px",
            color: "#bcbac9",
          }}>
            Provide each selected input. Only the modalities chosen in the previous step are available here.
          </p>

          {availableSteps.length === 0 ? (
            <p className="mt-8 text-sm" style={{ color: "#ff8a8a" }}>
              No modalities selected. Go back and choose at least one signal before uploading.
            </p>
          ) : (
            <div className="mt-10 flex gap-2">
              {availableSteps.map((step) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: "0px",
                    borderColor: activeStep === step.key ? "#c9b4fa" : "transparent",
                    color: activeStep === step.key ? "#1b1938" : "#bcbac9",
                    background: activeStep === step.key ? "#c9b4fa" : "transparent",
                  }}
                >
                  {step.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="mt-8 rounded-xl border p-8"
            style={{
              background: "#000000",
              borderColor: "#3f3a52",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {availableSteps.length === 0 ? (
              <p style={{ color: "#bcbac9" }}>No modality selected.</p>
            ) : (
              <div key={activeStep} className="space-y-4">
                <div>
                  <h3
                    className="text-xl font-medium"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "22px",
                      fontWeight: 460,
                      lineHeight: 1.1,
                      letterSpacing: "-0.315px",
                      color: "#ffffff",
                    }}
                  >
                    {modalityMeta[activeStep].title}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "#5a5772" }}>
                    {modalityMeta[activeStep].helper}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <label
                    className="flex h-48 cursor-pointer items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "#3f3a52",
                      background: "#0e0c1f",
                      color: files[activeStep] ? "#ffffff" : "#5a5772",
                    }}
                  >
                    <span>
                      {files[activeStep] ? files[activeStep].name : "Click to select a file or drop it here"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept={modalityMeta[activeStep].accept}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        handleChange(activeStep, file);
                      }}
                    />
                  </label>

                  {files[activeStep] && (
                    <button
                      type="button"
                      onClick={() => handleChange(activeStep, null)}
                      className="text-left text-sm underline"
                      style={{ color: "#bcbac9" }}
                    >
                      Remove selected file
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <p className="mt-4 text-sm" style={{ color: "#ff8a8a" }}>
              {submitError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border px-6 py-3 text-base font-semibold transition-colors duration-150"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "0px",
                borderColor: "#3f3a52",
                color: "#ffffff",
              }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting || !availableSteps.some((step) => step.key === activeStep && Boolean(files[step.key]))}
              onClick={handleSubmit}
              className="rounded-full px-6 py-3 text-base font-semibold transition-colors duration-150 disabled:opacity-40"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "0px",
                background: "#c9b4fa",
                color: "#1b1938",
              }}
            >
              {submitting ? "Submitting…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentUploadPage() {
  return (
    <Suspense fallback={<div className="mt-16 text-sm" style={{ color: "#bcbac9" }}>Loading upload step…</div>}>
      <AssessmentUploadInner />
    </Suspense>
  );
}
