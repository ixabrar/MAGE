"use client";

import { tokens } from "@/lib/design-tokens";

const steps = ["Upload", "Extract", "Validate", "Normalize", "Analyze"] as const;

export function BloodUpload() {
  return (
    <div className="rounded-xl border p-6" style={{ background: "#000000", borderColor: "#3f3a52" }}>
      <p
        style={{
          fontFamily: tokens.font.mono,
          fontSize: "12px",
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: "#c9b4fa",
        }}
      >
        Blood report
      </p>
      <p className="mt-2" style={{ fontFamily: tokens.font.mono, fontSize: "15px", lineHeight: 1.6, color: tokens.colors.muted }}>
        Upload your report. Supported formats: PDF, PNG, JPG/JPEG.
      </p>

      <span className="mt-5 inline-block rounded-md border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
        Upload report
      </span>

      <div className="mt-5 flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <span
            key={step}
            className="rounded-md border px-3 py-1"
            style={{
              borderColor: "rgba(255,255,255,0.18)",
              fontFamily: tokens.font.mono,
              fontSize: "12px",
              color: index === 0 ? "#ffffff" : "rgba(255,255,255,0.55)",
              letterSpacing: "0.5px",
            }}
          >
            {String(index + 1).padStart(2, "0")} {step}
          </span>
        ))}
      </div>
    </div>
  );
}
