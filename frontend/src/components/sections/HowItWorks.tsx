"use client";

import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Choose", desc: "Face or Hand", icon: "◈" },
  { n: "02", title: "Upload", desc: "Secure, validated", icon: "⬆" },
  { n: "03", title: "AI encodes", desc: "Separate encoders", icon: "⚡" },
  { n: "04", title: "Get age", desc: "Fused estimate", icon: "◎" },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-[#070709]" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: "#c9b4fa" }}>How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", color: "#fff" }}>
              Four steps.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#5a5772" }}>
            No theory walls — just the flow. Each signal is handled alone, then fused.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative rounded-2xl border p-5"
              style={{ background: "#0e0c1f", borderColor: "#1e1c2a" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>{s.n}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs" style={{ background: "rgba(201,180,250,0.12)", color: "#c9b4fa" }}>{s.icon}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold" style={{ color: "#fff" }}>{s.title}</h3>
              <p className="mt-1 text-sm" style={{ color: "#bcbac9" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
