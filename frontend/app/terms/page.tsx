import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions — MAGE",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="fixed inset-0 z-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" aria-hidden="true" />
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <Link
          href="/auth/signin"
          className="mb-8 inline-block text-sm text-white/70 underline"
          style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }}
        >
          ← Back to sign in
        </Link>

        <h1
          className="mt-4"
          style={{
            fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          Terms and Conditions
        </h1>

        <div className="mt-10 space-y-8" style={{ color: "#bcbac9" }}>
          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              1. Acceptance
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              By accessing or using MAGE, you agree to these terms. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              2. Service description
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              MAGE provides multimodal biological-age estimation from facial, dorsal-hand, and/or blood-derived inputs through a fusion layer.
              Outputs are estimates, not medical diagnoses.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              3. Accounts
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              <li>You must provide accurate information during signup.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use.</li>
            </ul>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              4. Acceptable use
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              You agree not to use the service for unlawful purposes, upload infringing content, reverse-engineer the models or APIs,
              or share account access with unauthorized persons.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              5. Biometric and sensitive data
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              Biometric inputs are processed only for the stated estimation purpose. Raw biometric content is not exposed in audit logs.
              Sensitive assets are separated from identity data where technically feasible.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              6. Intellectual property
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              MAGE, including models, interfaces, and branding, is owned by the platform operator.
              Unauthorized reproduction or redistribution is prohibited.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              7. Disclaimer
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              MAGE outputs are probabilistic estimates. They do not replace clinical judgment, diagnostic testing, or professional medical advice.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              8. Limitation of liability
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              To the maximum extent permitted by law, the platform operator is not liable for indirect, incidental, or consequential damages arising from use of MAGE.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              9. Changes
            </h2>
            <p className="mt-2" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              Terms may be updated from time to time. Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
