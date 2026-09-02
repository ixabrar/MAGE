"use client";

import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Choose", sub: "Face or Hand", desc: "Pick one or both. No account needed." },
  { n: "02", title: "Upload", sub: "Secure & private", desc: "Encrypted, validated, never public." },
  { n: "03", title: "AI encodes", sub: "Separate models", desc: "Each signal has its own encoder." },
  { n: "04", title: "Get age", sub: "Fused estimate", desc: "One coherent result, instantly." },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-16 bg-[#070709]" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: "#c9b4fa" }}>How it works</p>
          <h2 className="mx-auto mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", color: "#fff" }}>
            Four steps.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed" style={{ color: "#bcbac9" }}>Simple, quick, and secure — no jargon.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-xl border bg-[#0e0c1f] p-6 text-center"
              style={{ borderColor: "#1e1c2a" }}
            >
              <p className="text-xs font-bold tracking-[1.4px]" style={{ color: "#c9b4fa" }}>{s.n}</p>
              <h3 className="mt-2 text-base font-semibold" style={{ color: "#fff" }}>{s.title}</h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "#c9b4fa" }}>{s.sub}</p>
              <p className="mx-auto mt-2 max-w-[20ch] text-sm leading-relaxed" style={{ color: "#bcbac9" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
