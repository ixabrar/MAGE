"use client";

import { tokens } from "@/lib/design-tokens";

export function PrivacyCenter() {
  return (
    <div className="space-y-6">
      <p
        style={{
          fontFamily: tokens.font.mono,
          fontSize: "12px",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: tokens.colors.muted,
        }}
      >
        Privacy & data
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "14px", color: "#ffffff" }}>Face images</p>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "13px", color: tokens.colors.muted }}>
            3 stored assessments
          </p>
        </div>
        <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "14px", color: "#ffffff" }}>Dorsal hand</p>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "13px", color: tokens.colors.muted }}>
            2 stored assessments
          </p>
        </div>
        <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "14px", color: "#ffffff" }}>Blood reports</p>
          <p style={{ fontFamily: tokens.font.mono, fontSize: "13px", color: tokens.colors.muted }}>
            1 stored report
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
          Download my data
        </span>
        <span className="border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
          Delete selected data
        </span>
        <span className="border border-white/35 px-4 py-2 text-white" style={{ fontFamily: tokens.font.mono, fontSize: "14px" }}>
          Delete account
        </span>
      </div>
    </div>
  );
}
