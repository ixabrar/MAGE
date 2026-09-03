"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import BiometricCameraCapture from "@/components/camera/BiometricCameraCapture";

const steps = [
  { key: "face", label: "Face", hint: "Camera / Upload" },
  { key: "dorsal_hand", label: "Dorsal Hand", hint: "Camera / Upload" },
  { key: "blood", label: "Blood", hint: "PDF / Image" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const modalityMeta: Record<StepKey, { title: string; accept: string; helper: string }> = {
  face: {
    title: "Face Input — EfficientNet-B0 MoE",
    accept: "image/*",
    helper: "Capture a live frontal face photo with the guided biometric frame or upload an image.",
  },
  dorsal_hand: {
    title: "Dorsal Hand Input — ResNet18",
    accept: "image/*",
    helper: "Capture the back of your hand palm-down or upload a dorsal hand image.",
  },
  blood: {
    title: "Blood Chemistry Report",
    accept: ".pdf,image/*",
    helper: "Upload a PDF report or clear image of clinical blood biomarker metrics.",
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

  const [activeStep, setActiveStep] = useState<StepKey>("face");
  const [files, setFiles] = useState<Record<StepKey, File | null>>({
    face: null,
    dorsal_hand: null,
    blood: null,
  });
  const [filePreviews, setFilePreviews] = useState<Record<StepKey, string | null>>({
    face: null,
    dorsal_hand: null,
    blood: null,
  });
  const [inputModes, setInputModes] = useState<Record<StepKey, "file" | "camera">>({
    face: "file",
    dorsal_hand: "file",
    blood: "file",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAssessmentId, setSubmittedAssessmentId] = useState<string | null>(null);
  const [dorsalResult, setDorsalResult] = useState<null | { predicted_age: number; confidence: number; age_bins: Record<string, number>; source: string }>(null);
  const [dorsalLoading, setDorsalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (step: StepKey, file: File | null, customPreviewUrl?: string) => {
    setFiles((current) => ({ ...current, [step]: file }));
    if (file) {
      if (customPreviewUrl) {
        setFilePreviews((prev) => ({ ...prev, [step]: customPreviewUrl }));
      } else if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setFilePreviews((prev) => ({ ...prev, [step]: url }));
      } else {
        setFilePreviews((prev) => ({ ...prev, [step]: null }));
      }
    } else {
      setFilePreviews((prev) => ({ ...prev, [step]: null }));
    }
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
          } finally {
            setDorsalLoading(false);
          }
        })();
      }

      // Build multipart FormData with real file bytes
      const formData = new FormData();
      formData.append("modalities", JSON.stringify(modalities));
      for (const step of availableSteps) {
        const file = files[step.key];
        if (file) {
          formData.append(step.key, file, file.name);
        }
      }

      if (previewPromise) {
        await Promise.race([previewPromise, new Promise((r) => setTimeout(r, 3000))]);
      }

      const response = await fetch(`${apiBase}/api/assessment`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || "Assessment submission failed");
      }

      const data = await response.json();
      setSubmittedAssessmentId(data.assessment_id);
      setSubmitted(true);

      if (dorsalFile && dorsalResult) {
        setTimeout(() => router.push(`/assessment/processing?assessment_id=${data.assessment_id}`), 1200);
      } else if (dorsalFile) {
        setTimeout(() => router.push(`/assessment/processing?assessment_id=${data.assessment_id}`), 500);
      } else {
        router.push(`/assessment/processing?assessment_id=${data.assessment_id}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
      setSubmitting(false);
    }
  };

  const hasAtLeastOneFile = Object.values(files).some((f) => f !== null);

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[1.8px] text-[#bcbac9] transition-colors duration-150 hover:border-white hover:bg-white/6 hover:text-white"
            style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
          >
            ← MAGE
          </a>
          <div className="text-sm font-medium text-[#5a5772]">
            {submitted ? "Submitted" : "Step 2 of 3"}
          </div>
        </nav>

        <div className="mt-16 max-w-2xl">
          <h1
            className="text-4xl font-medium tracking-tight text-white sm:text-5xl"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              letterSpacing: "-1.32px",
            }}
          >
            Upload or Capture Inputs
          </h1>
          <p
            className="mt-6 text-lg text-[#bcbac9]"
            style={{
              fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
              lineHeight: 1.5,
            }}
          >
            Provide biometric inputs using live camera capture or file upload. Inputs are preprocessed and aligned before deep neural inference.
          </p>

          {availableSteps.length === 0 ? (
            <p className="mt-8 text-sm text-red-400">
              No modalities selected. Go back and choose at least one signal before uploading.
            </p>
          ) : (
            /* Modality Tabs */
            <div className="mt-10 flex flex-wrap gap-2" suppressHydrationWarning>
              {availableSteps.map((step) => {
                const hasFile = !!files[step.key];
                const isCurrent = activeStep === step.key;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      isCurrent
                        ? "border-[#c9b4fa] bg-[#c9b4fa] text-[#1b1938]"
                        : "border-[#3f3a52] bg-transparent text-[#bcbac9] hover:border-white/40 hover:text-white"
                    }`}
                  >
                    <span>{step.label}</span>
                    {hasFile && (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent ? "bg-[#1b1938] text-[#c9b4fa]" : "bg-[#c9b4fa] text-[#1b1938]"
                      }`}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Modality Container */}
          <div
            className="mt-8 rounded-xl border border-[#3f3a52] bg-[#000000] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          >
            {availableSteps.length === 0 ? (
              <p className="text-[#bcbac9]">No modality selected.</p>
            ) : (
              <div key={activeStep} className="space-y-6" suppressHydrationWarning>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-medium text-white">
                      {modalityMeta[activeStep].title}
                    </h3>
                    <p className="mt-1 text-xs text-[#bcbac9]/80">
                      {modalityMeta[activeStep].helper}
                    </p>
                  </div>

                  {/* Camera / Upload Switch for Image Modalities */}
                  {(activeStep === "face" || activeStep === "dorsal_hand") && !files[activeStep] && (
                    <div className="inline-flex rounded-lg border border-[#3f3a52] bg-[#0e0c1f] p-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setInputModes((prev) => ({ ...prev, [activeStep]: "file" }))}
                        className={`rounded-md px-3 py-1.5 transition-colors ${
                          inputModes[activeStep] === "file"
                            ? "bg-[#c9b4fa] text-[#1b1938]"
                            : "text-[#bcbac9] hover:text-white"
                        }`}
                      >
                        📁 File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputModes((prev) => ({ ...prev, [activeStep]: "camera" }))}
                        className={`rounded-md px-3 py-1.5 transition-colors ${
                          inputModes[activeStep] === "camera"
                            ? "bg-[#c9b4fa] text-[#1b1938]"
                            : "text-[#bcbac9] hover:text-white"
                        }`}
                      >
                        📷 Live Camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Content: Camera Capture or File Dropzone / Selected Preview */}
                {files[activeStep] ? (
                  /* Confirmed Selection Preview Card */
                  <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl border border-[#c9b4fa]/40 bg-[#0e0c1f] p-5">
                    {filePreviews[activeStep] ? (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#c9b4fa]/50">
                        <img
                          src={filePreviews[activeStep]!}
                          alt="Input preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black text-2xl">
                        📄
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">
                        {files[activeStep]!.name}
                      </p>
                      <p className="mt-1 text-xs text-[#bcbac9]">
                        {(files[activeStep]!.size / 1024).toFixed(1)} KB · Ready for inference
                      </p>
                      <div className="mt-3 flex gap-3 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => handleChange(activeStep, null)}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 underline"
                        >
                          Remove / Retake
                        </button>
                      </div>
                    </div>
                  </div>
                ) : inputModes[activeStep] === "camera" && (activeStep === "face" || activeStep === "dorsal_hand") ? (
                  /* Live Biometric Camera with Auto-Cropping ROI */
                  <BiometricCameraCapture
                    modality={activeStep}
                    onCapture={(file, previewUrl) => {
                      handleChange(activeStep, file, previewUrl);
                    }}
                    onCancel={() => setInputModes((prev) => ({ ...prev, [activeStep]: "file" }))}
                  />
                ) : (
                  /* Standard Drag & Drop File Zone */
                  <div className="flex flex-col gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0] ?? null;
                        if (file) handleChange(activeStep, file);
                      }}
                      className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#3f3a52] bg-[#0e0c1f] p-6 transition-colors hover:border-[#c9b4fa]/60 hover:bg-[#141228]"
                    >
                      <div className="mb-2 text-2xl text-[#c9b4fa]">
                        {activeStep === "blood" ? "📄" : "📷"}
                      </div>
                      <span className="text-sm font-medium text-white">
                        Click to select {activeStep.replace("_", " ")} file or drag &amp; drop here
                      </span>
                      <span className="mt-1 text-xs text-[#5a5772]">
                        {modalityMeta[activeStep].accept.replace(/,/g, ", ")} · Max 15MB
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
                  </div>
                )}
              </div>
            )}
          </div>

          {submitError && (
            <p className="mt-4 text-sm text-red-400">
              {submitError}
            </p>
          )}

          {dorsalLoading && (
            <div className="mt-4 rounded-lg border border-[#c9b4fa] bg-[rgba(201,180,250,0.08)] px-4 py-3 text-sm text-[#bcbac9]">
              Running dorsal hand ResNet18 inference on CPU…
            </div>
          )}

          {/* Action Buttons Bar */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-[#3f3a52] px-6 py-2.5 text-sm font-semibold text-[#bcbac9] transition-colors hover:border-white hover:text-white"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !hasAtLeastOneFile}
              className={`rounded-full px-8 py-3 text-sm font-bold transition-all duration-150 ${
                submitting || !hasAtLeastOneFile
                  ? "cursor-not-allowed border border-[#3f3a52] bg-transparent text-[#5a5772]"
                  : "bg-[#c9b4fa] text-[#1b1938] hover:scale-105 shadow-[0_0_20px_rgba(201,180,250,0.3)]"
              }`}
            >
              {submitting ? "Processing Assessment…" : "Continue to Fusion →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-sm text-[#bcbac9]">
          Loading upload step…
        </div>
      }
    >
      <AssessmentUploadInner />
    </Suspense>
  );
}
