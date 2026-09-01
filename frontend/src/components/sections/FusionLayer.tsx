"use client";

import { motion } from "framer-motion";

const branches = [
  {
    label: "Face encoder",
    description: "Encodes facial imagery into a compact biological-age representation.",
  },
  {
    label: "Dorsal hand encoder",
    description: "Encodes dorsal-hand imagery into a compact biological-age representation.",
  },
  {
    label: "Blood encoder",
    description: "Encodes blood-report features into a compact biological-age representation.",
  },
] as const;

export default function FusionLayer() {
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
          Fusion layer
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
          The fusion layer is the core differentiator. It combines only the representations for modalities that are
          actually available, so missing inputs do not force a degraded or fake prediction.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {branches.map((branch) => (
            <div
              key={branch.label}
              className="rounded-xl border p-8"
              style={{
                background: "#000000",
                borderColor: "#3f3a52",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
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
                {branch.label}
              </h3>
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
                {branch.description}
              </p>
            </div>
          ))}
        </div>

        <motion.div
          className="mt-10 rounded-xl border p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          style={{
            background: "#000000",
            borderColor: "#3f3a52",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
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
            Fusion → estimated biological age
          </h3>
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
            Available representations are combined into one estimate. Missing modalities are masked out rather than
            replaced with heuristics or fake defaults.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
