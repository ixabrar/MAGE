"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const modalities = [
  {
    id: "face",
    label: "Face",
    description: "Visual aging signal from facial features.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL",
  },
  {
    id: "dorsal_hand",
    label: "Dorsal Hand",
    description: "Hand-aging characteristics from dorsal imaging.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL",
  },
  {
    id: "blood",
    label: "Blood",
    description: "Blood-derived laboratory features.",
    inputType: "PDF / Image",
    status: "BLOOD-DERIVED SIGNAL",
  },
] as const;

type ModalityId = (typeof modalities)[number]["id"];

export default function AssessmentBuilder() {
  const [active, setActive] = useState<ModalityId[]>(["face", "dorsal_hand", "blood"]);

  const toggle = (id: ModalityId) => {
    setActive((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <section className="py-24 bg-black" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <h2
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
        </h2>
        <p
          className="mt-6 max-w-2xl text-lg"
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
          branches and route their representations through the fusion layer.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {modalities.map((modality) => {
            const isActive = active.includes(modality.id);
            return (
              <motion.div
                key={modality.id}
                className="rounded-xl border p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                style={{
                  background: "#000000",
                  borderColor: isActive ? "#c9b4fa" : "#3f3a52",
                  boxShadow: isActive ? "0 0 0 1px rgba(201,180,250,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center justify-between">
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
                  <button
                    type="button"
                    onClick={() => toggle(modality.id)}
                    className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
                    style={{
                      fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      lineHeight: 1.0,
                      letterSpacing: "0px",
                      borderColor: isActive ? "#c9b4fa" : "transparent",
                      color: isActive ? "#1b1938" : "#bcbac9",
                      background: isActive ? "#c9b4fa" : "transparent",
                    }}
                  >
                    {isActive ? "Selected" : "Select"}
                  </button>
                </div>
                <p
                  className="mt-3 text-base"
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
                  className="mt-4 text-sm"
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
