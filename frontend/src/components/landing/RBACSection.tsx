"use client";

import { tokens } from "@/lib/design-tokens";

const roles = [
  {
    role: "USER",
    permissions: [
      "Manage own profile",
      "Provide consent",
      "Upload own data",
      "Run assessments",
      "View own results",
      "Manage own data",
    ],
  },
  {
    role: "CLINICIAN",
    permissions: [
      "Access assigned users",
      "View permitted assessments",
      "Review results",
      "View longitudinal information",
    ],
  },
  {
    role: "ML RESEARCHER",
    permissions: [
      "Access approved research datasets",
      "View model metrics",
      "Evaluate models",
      "Access anonymized datasets",
    ],
  },
];

export function RBACSection() {
  return (
    <section id="rbac" className="px-6 py-24 sm:px-10 lg:px-16">
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
          Role-based access control.
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
          Authentication answers “who are you?” Authorization answers “what are you allowed to do?” MAGE uses
          both. Navigation visibility is UX. Authorization is security.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {roles.map((item) => (
            <div key={item.role} className="border p-8" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
              <p
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: tokens.colors.muted,
                }}
              >
                Role
              </p>
              <h3
                className="mt-2 text-white"
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: "20px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {item.role}
              </h3>
              <ul className="mt-4 space-y-2">
                {item.permissions.map((permission) => (
                  <li
                    key={permission}
                    style={{
                      fontFamily: tokens.font.mono,
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: tokens.colors.muted,
                    }}
                  >
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
