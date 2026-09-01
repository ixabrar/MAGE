"use client";

import { tokens } from "@/lib/design-tokens";

const modalities = [
  {
    id: "face" as const,
    label: "Face",
    description: "Camera or upload a clear facial image.",
    inputType: "Camera / Upload",
  },
  {
    id: "dorsal_hand" as const,
    label: "Dorsal Hand",
    description: "Capture or upload the back of your hand.",
    inputType: "Camera / Upload",
  },
  {
    id: "blood" as const,
    label: "Blood",
    description: "Upload a blood report as PDF or image.",
    inputType: "PDF / Image",
  },
] as const;

export type ModalityOption = (typeof modalities)[number];
export type ModalityId = ModalityOption["id"];

type ModalitySelectorProps = {
  selected: ModalityId[];
  onChange: (selected: ModalityId[]) => void;
};

export function ModalitySelector({ selected, onChange }: ModalitySelectorProps) {
  const toggle = (id: ModalityId) => {
    onChange(
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {modalities.map((modality) => {
        const isActive = selected.includes(modality.id);
        return (
          <button
            key={modality.id}
            onClick={() => toggle(modality.id)}
            className="group relative flex flex-col gap-4 rounded-xl border p-6 text-left transition-all duration-150"
            style={{
              background: "#000000",
              borderColor: isActive ? "#c9b4fa" : "#3f3a52",
              boxShadow: isActive ? "0 0 0 1px rgba(201,180,250,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "12px",
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  color: isActive ? "#c9b4fa" : tokens.colors.muted,
                }}
              >
                {modality.label}
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: tokens.colors.muted,
                }}
              >
                {modality.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {modality.inputType}
              </span>
              <span
                className="rounded-md border px-3 py-1.5 text-xs font-semibold uppercase"
                style={{
                  borderColor: isActive ? "#ffffff" : "rgba(255,255,255,0.35)",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                  fontFamily: tokens.font.mono,
                  letterSpacing: "0.5px",
                }}
              >
                {isActive ? "Selected" : "Select"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { modalities };
