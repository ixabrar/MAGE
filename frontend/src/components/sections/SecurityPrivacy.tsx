"use client";

import { motion } from "framer-motion";

const items = [
  {
    title: "Secure upload",
    description:
      "Face images and blood reports are transferred over encrypted channels and are never exposed through public asset URLs.",
  },
  {
    title: "Private storage",
    description:
      "Sensitive assets are stored separately from identity data, with retention and deletion controls designed from the start.",
  },
  {
    title: "Consent and control",
    description:
      "Processing only begins after clear consent. Users can review, delete, or request deletion of their stored data where supported.",
  },
  {
    title: "Auditability",
    description:
      "Important actions are recorded in protected audit logs so sensitive access remains reviewable without exposing raw biometric content.",
  },
] as const;

export default function SecurityPrivacy() {
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
          Security and privacy
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
          Sensitive inputs are protected by design. MAGE separates identity from biometric data, records auditable
          actions, and keeps raw files out of ordinary frontend flows.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <motion.div
              key={item.title}
              className="rounded-xl border p-8"
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
                {item.title}
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
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
