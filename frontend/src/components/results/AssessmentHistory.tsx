"use client";

import { tokens } from "@/lib/design-tokens";

const assessments = [
  {
    id: "A-001",
    date: "30 Aug 2026",
    modalities: "Face + Hand + Blood",
    estimate: "27.4",
  },
  {
    id: "A-002",
    date: "28 Jul 2026",
    modalities: "Face + Hand",
    estimate: "28.1",
  },
  {
    id: "A-003",
    date: "15 Jun 2026",
    modalities: "Face",
    estimate: "29.0",
  },
];

export function AssessmentHistory() {
  return (
    <div className="space-y-4">
      <p
        style={{
          fontFamily: tokens.font.mono,
          fontSize: "12px",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: tokens.colors.muted,
        }}
      >
        My assessments
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {assessments.map((item) => (
          <div key={item.id} className="border p-6" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
            <p style={{ fontFamily: tokens.font.mono, fontSize: "13px", color: tokens.colors.muted }}>
              {item.date}
            </p>
            <p style={{ fontFamily: tokens.font.mono, fontSize: "14px", color: "#ffffff" }}>
              {item.modalities}
            </p>
            <p style={{ fontFamily: tokens.font.mono, fontSize: "14px", color: tokens.colors.muted }}>
              Estimated age: {item.estimate}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
