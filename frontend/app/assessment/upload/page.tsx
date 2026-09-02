"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
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
    title: "Dorsal hand input — ResNet18",
    accept: "image/*",
    helper: "Upload a dorsal-hand image (ResNet18 resnet18_consistent_age_best.pth, 128M) — real inference on CPU, fallback to mock if unavailable.",
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
  const selectedParam = params.get("selected");
  const selected: StepKey[] = useMemo(() => {
    if (!selectedParam) return ["face", "dorsal_hand", "blood"];
    return selectedParam
      .split(",")
      .filter((value): value is StepKey => steps.some((step) => step.key === value));
  }, [selectedParam]);
  const availableSteps = useMemo(() => steps.filter((step) => selected.includes(step.key)), [selected]);
  // Keep initial deterministic to avoid hydration mismatch (server/client both start at "face")
  // useEffect below will sync to correct tab from URL (?selected=...)
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
  const [dorsalResult, setDorsalResult] = useState<null | { predicted_age: number; confidence: number; age_bins: Record<string, number>; source: string }>(null);
  const [dorsalLoading, setDorsalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (step: StepKey, file: File | null) => {
    setFiles((current) => ({ ...current, [step]: file }));
  };

  const handleBack = () => {
    setSubmitted(false);
    setSubmittedAssessmentId(null);
    router.push("/assessment");
  };

  useEffect(() => {
    if (availableSteps.length === 0) {
      setActiveStep("face");
      return;
    }
    const currentStillValid = availableSteps.some((step) => step.key === activeStep);
    if (!currentStillValid) {
      setActiveStep(availableSteps[0].key);
    }
  }, [availableSteps, activeStep]);

  // reset file input value when switching tabs so same file can be re-selected
  useEffect(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [activeStep]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setDorsalResult(null);

    try {
      const modalities = availableSteps.map((step) => step.key);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // If dorsal_hand file exists, we can show preview by calling real model while also sending real bytes via fusion
      const dorsalFile = files["dorsal_hand"];
      let previewPromise: Promise<void> | null = null;
      if (modalities.includes("dorsal_hand") && dorsalFile) {
        setDorsalLoading(true);
        previewPromise = (async () => {
          try {
            const { predictDorsalHand } = await import("@/lib/api");
            const real = await predictDorsalHand(dorsalFile);
            setDorsalResult(real);
          } catch (e) {
            console.warn("dorsal preview failed, will rely on fusion real inference", e);
            // don't block submission; fusion will also try real
          } finally {
            setDorsalLoading(false);
          }
        })();
      }

      // Build multipart FormData with real file bytes so backend dorsal_adapter gets file_path
      const formData = new FormData();
      formData.append("modalities", JSON.stringify(modalities));
      for (const step of availableSteps) {
        const file = files[step.key];
        if (file) {
          // key must match modality name exactly (backend looks for form.get(modality))
          formData.append(step.key, file, file.name);
        }
      }

      // Wait for preview to settle a bit but don't block forever (max 3s)
      if (previewPromise) {
        await Promise.race([previewPromise, new Promise((r) => setTimeout(r, 3000))]);
      }

      const response = await fetch(`${apiBase}/api/assessment`, {
        method: "POST",
        body: formData,
        // no content-type header — browser sets multipart boundary
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || "Assessment submission failed");
      }

      const data = await response.json();
      setSubmittedAssessmentId(data.assessment_id);
      setSubmitted(true);
      // Show preview a bit if dorsal was used
      if (dorsalFile && dorsalResult) {
        setTimeout(() => router.push(`/assessment/processing?assessment_id=${data.assessment_id}`), 1500);
      } else if (dorsalFile) {
        // wait a moment for fusion to be ready
        setTimeout(() => router.push(`/assessment/processing?assessment_id=${data.assessment_id}`), 500);
      } else {
        router.push(`/assessment/processing?assessment_id=${data.assessment_id}`);
      }
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
            <div className="mt-10 flex gap-2" suppressHydrationWarning>
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
              <div key={activeStep} className="space-y-4" suppressHydrationWarning>
                <div>
                  <h3
                    suppressHydrationWarning
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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0] ?? null;
                      if (file) handleChange(activeStep, file);
                    }}
                    className="flex h-48 cursor-pointer items-center justify-center rounded-lg border relative overflow-hidden"
                    style={{
                      borderColor: "#3f3a52",
                      background: "#0e0c1f",
                      color: files[activeStep] ? "#ffffff" : "#5a5772",
                    }}
                  >
                    <span className="pointer-events-none">
                      {files[activeStep] ? files[activeStep].name : "Click to select a file or drop it here"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={modalityMeta[activeStep].accept}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        handleChange(activeStep, file);
                      }}
                    />
                  </div>

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

          {dorsalLoading && (
            <div className="mt-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "#c9b4fa", background: "rgba(201,180,250,0.08)", color: "#bcbac9" }}>
              Running dorsal hand ResNet18 (resnet18_consistent_age_best.pth) on CPU…
            </div>
          )}

          {dorsalResult && (
            <div className="mt-4 rounded-xl border p-6" style={{ borderColor: "#c9b4fa", background: "#000" }}>
              <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
                Dorsal hand — ResNet18 result (real model)
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                  <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Predicted age</p>
                  <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{dorsalResult.predicted_age.toFixed(1)}</p>
                  <p style={{ color: "#5a5772", fontSize: "12px" }}>years · {dorsalResult.source}</p>
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                  <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Confidence</p>
                  <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{(dorsalResult.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
                  <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Age bins</p>
                  <p style={{ color: "#bcbac9", fontSize: "12px", marginTop: "4px", lineHeight: 1.6 }}>
                    {Object.entries(dorsalResult.age_bins).map(([k, v]) => `${k}: ${(Number(v) * 100).toFixed(0)}%`).join(" · ")}
                  </p>
                </div>
              </div>
              <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "8px" }}>Backend: POST /api/predict/dorsal-hand → {dorsalResult.source}. Mock fusion still runs via POST /api/assessment for demo.</p>
            </div>
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
              disabled={submitting || dorsalLoading || !availableSteps.every((step) => Boolean(files[step.key]))}
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
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-sm text-[#bcbac9]">Loading upload step…</div>}>
      <AssessmentUploadInner />
    </Suspense>
  );
}
