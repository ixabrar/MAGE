"use client";

import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    title: "Input",
    description:
      "The user provides whichever biological signals are available: face, dorsal-hand, and/or blood-report inputs.",
  },
  {
    title: "Modality-specific encoding",
    description:
      "Each independent modality encoder turns its input into a learned representation without depending on the others.",
  },
  {
    title: "Fusion",
    description:
      "The fusion layer combines the available representations into a single coherent biological-age estimate.",
  },
  {
    title: "Estimate",
    description:
      "MAGE returns an estimated biological age alongside the modality provenance, model versions, and disclaimers.",
  },
] as const;

export default function HowItWorks() {
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
          How MAGE works
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
          MAGE does not rely on a single monolithic model. Each available modality is processed independently, then
          fused into one estimate.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="rounded-xl border p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                background: "#000000",
                borderColor: "#3f3a52",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <span
                className="text-sm"
                style={{
                  fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: 1.0,
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  color: "#c9b4fa",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                className="mt-3 text-xl font-medium"
                style={{
                  fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "22px",
                  fontWeight: 460,
                  lineHeight: 1.1,
                  letterSpacing: "-0.315px",
                  color: "#ffffff",
                }}
              >
                {step.title}
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
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
