"use client";

import { tokens } from "@/lib/design-tokens";

const sections = [
  {
    title: "Secure data flow",
    items: ["HTTPS", "API", "Encrypted storage", "Inference", "Retention/Delete"],
  },
  {
    title: "Core controls",
    items: [
      "TLS in transit",
      "Encryption at rest",
      "Secure HTTP-only sessions",
      "RBAC + resource-level authorization",
      "Audit logging",
      "Explicit consent by modality",
      "Retention and deletion policy",
      "Restricted raw-data access",
    ],
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="px-6 py-24 sm:px-10 lg:px-16">
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
          Privacy and security by architecture.
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
          Face images and blood reports are sensitive data. Security is not only a login feature; it runs through
          storage, inference, authorization, retention and auditing.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="border p-8" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
              <p
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: tokens.colors.muted,
                }}
              >
                {section.title}
              </p>
              <ul className="mt-4 space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      fontFamily: tokens.font.mono,
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "#ffffff",
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
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
{`Identity DB                         Secure data store
────────────                        ─────────────────
user_id                             asset_id
email                               pseudonymous user_ref
role                                storage_key
session metadata                    encryption metadata
                                    retention policy

Separate identity from raw biometric / health assets.`}
          </pre>
        </div>
      </div>
    </section>
  );
}
