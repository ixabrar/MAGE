"use client";

import { tokens } from "@/lib/design-tokens";

const checks = [
  "Image quality",
  "Face detected",
  "Orientation",
  "Ready for analysis",
];

export function FaceCapture() {
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
        Face analysis
      </p>
      <p className="mt-2" style={{ fontFamily: tokens.font.mono, fontSize: "15px", lineHeight: 1.6, color: tokens.colors.muted }}>
        Capture or upload a clear image.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-md border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
          Camera
        </span>
        <span className="rounded-md border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
          Upload image
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check}
            className="rounded-lg border p-4"
            style={{ borderColor: "rgba(255,255,255,0.18)" }}
          >
            <span style={{ fontFamily: tokens.font.mono, fontSize: "13px", color: "#ffffff" }}>
              ✓ {check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
