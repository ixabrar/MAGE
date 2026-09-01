// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardModelsPage() {
  let session;
if (DEV_BYPASS) {
  session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "MAGE Development User", role: "user" } };
} else {
  session = await auth();
}
  if (!session?.user) redirect("/login");

  return (
    
      <div className="space-y-6">
        <h1
          style={{
            fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          Model registry
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9" }}>
          Browse registered modality and fusion models. Replace or upgrade models without redesigning the application.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {["Face", "Dorsal Hand", "Blood", "Fusion"].map((group) => (
            <div key={group} className="border p-8" style={{ borderColor: "#3f3a52", background: "#000000" }}>
              <p
                style={{
                  fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  color: "#c9b4fa",
                }}
              >
                {group}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[group.toLowerCase().replace(" ", "-") + "-v1", group.toLowerCase().replace(" ", "-") + "-v2"].map((version) => (
                  <span
                    key={version}
                    className="border px-3 py-1"
                    style={{
                      borderColor: "#3f3a52",
                      color: "#ffffff",
                      fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    {version}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    
  );
}
