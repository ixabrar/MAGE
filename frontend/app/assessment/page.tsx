"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const modalities = [
  {
    id: "face",
    label: "Face",
    description: "Visual aging signal from facial features.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL" as const,
  },
  {
    id: "dorsal_hand",
    label: "Dorsal Hand",
    description: "Hand-aging characteristics from dorsal imaging.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL" as const,
  },
  {
    id: "blood",
    label: "Blood",
    description: "Blood-derived laboratory features.",
    inputType: "PDF / Image",
    status: "BLOOD-DERIVED SIGNAL" as const,
  },
] as const;

// Public flow shows Face + Hand only; Blood stays available via doctor report flow
const publicModalities = modalities.filter((m) => m.id !== "blood") as unknown as typeof modalities;

type ModalityId = (typeof modalities)[number]["id"];
type PublicModalityId = (typeof publicModalities)[number]["id"];

export default function AssessmentPage() {
  const [active, setActive] = useState<PublicModalityId[]>(["face", "dorsal_hand"]);
  const router = useRouter();

  const toggle = (id: PublicModalityId) => {
    setActive((current) =>
      current.includes(id) ? (current.filter((item) => item !== id) as PublicModalityId[]) : [...current, id]
    );
  };

  const canContinue = active.length > 0;

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
            Step 1 of 3
          </div>
        </nav>

        <div className="mt-16 max-w-2xl">
          <h1
            className="text-4xl font-medium tracking-tight"
            style={{
              fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              fontSize: "48px",
              fontWeight: 460,
              lineHeight: 0.96,
              letterSpacing: "-1.32px",
              color: "#ffffff",
            }}
          >
            New assessment
          </h1>
          <p
            className="mt-6 text-lg"
            style={{
              fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              fontSize: "18px",
              fontWeight: 540,
              lineHeight: 1.5,
              letterSpacing: "-0.135px",
              color: "#bcbac9",
            }}
          >
            Select the biological signals you want to include. The backend will activate only the relevant modality
            branches.
          </p>

          <div className="mt-10 grid gap-4">
            {publicModalities.map((modality) => {
              const isActive = active.includes(modality.id);
              return (
                <button
                  key={modality.id}
                  type="button"
                  onClick={() => toggle(modality.id)}
                  className="w-full rounded-xl border p-6 text-left transition-colors duration-150"
                  style={{
                    background: "#000000",
                    borderColor: isActive ? "#c9b4fa" : "#3f3a52",
                    boxShadow: isActive ? "0 0 0 1px rgba(201,180,250,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="text-xl font-medium"
                        style={{
                          fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                          fontSize: "22px",
                          fontWeight: 460,
                          lineHeight: 1.1,
                          letterSpacing: "-0.315px",
                          color: "#ffffff",
                        }}
                      >
                        {modality.label}
                      </h3>
                      <p
                        className="mt-2 text-base"
                        style={{
                          fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                          fontSize: "16px",
                          fontWeight: 460,
                          lineHeight: 1.5,
                          letterSpacing: "0px",
                          color: "#bcbac9",
                        }}
                      >
                        {modality.description}
                      </p>
                      <p
                        className="mt-2 text-sm"
                        style={{
                          fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                          fontSize: "14px",
                          fontWeight: 460,
                          lineHeight: 1.4,
                          letterSpacing: "0px",
                          color: "#5a5772",
                        }}
                      >
                        {modality.inputType}
                      </p>
                    </div>
                    <div
                      className="h-5 w-5 rounded-full border"
                      style={{
                        borderColor: isActive ? "#c9b4fa" : "#3f3a52",
                        background: isActive ? "#c9b4fa" : "transparent",
                      }}
                    >
                      {isActive && (
                        <span className="block h-full w-full text-center text-xs font-bold" style={{ color: "#1b1938" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <p className="text-sm" style={{ color: "#5a5772" }}>
              {active.length} selected
            </p>
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => router.push(`/assessment/upload?selected=${active.join(",")}`)}
              className="rounded-full px-6 py-3 text-base font-semibold transition-colors duration-150 disabled:opacity-40"
              style={{
                fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "0px",
                background: "#c9b4fa",
                color: "#1b1938",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
