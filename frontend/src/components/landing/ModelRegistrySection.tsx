"use client";

import { tokens } from "@/lib/design-tokens";

const registry = [
  {
    name: "Face",
    versions: ["face-v1.3", "face-v2"],
  },
  {
    name: "Dorsal Hand",
    versions: ["hand-v0.8", "hand-v1"],
  },
  {
    name: "Blood",
    versions: ["blood-v1.1", "blood-v2"],
  },
  {
    name: "Fusion",
    versions: ["fusion-v1.0", "fusion-v2"],
  },
];

export function ModelRegistrySection() {
  return (
    <section id="models" className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="max-w-6xl">
        <h2
          className="text-white"
          style={{
            fontFamily: tokens.font.mono,
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Model registry and versioning.
        </h2>
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
          Every prediction can retain its model versions. This makes experiments reproducible and allows future
          model versions to coexist with historical results.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {registry.map((group) => (
            <div key={group.name} className="border p-8" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
              <p
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: tokens.colors.muted,
                }}
              >
                {group.name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.versions.map((version) => (
                  <span
                    key={version}
                    className="border px-3 py-1"
                    style={{
                      borderColor: "rgba(255,255,255,0.22)",
                      fontFamily: tokens.font.mono,
                      fontSize: "13px",
                      color: "#ffffff",
                    }}
                  >
                    {version}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border p-8" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <pre
            style={{
              fontFamily: tokens.font.mono,
              fontSize: "14px",
              lineHeight: 1.8,
              color: "#cfe0f4",
              overflowX: "auto",
            }}
          >
{`Prediction record
─────────────────
assessment_id
timestamp
modalities_used

face_model_version
hand_model_version
blood_model_version
fusion_model_version`}
          </pre>
        </div>
      </div>
    </section>
  );
}
