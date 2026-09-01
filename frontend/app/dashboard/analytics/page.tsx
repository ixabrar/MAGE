// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardAnalyticsPage() {
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
          Analytics
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9" }}>
          View aggregate analytics. No raw sensitive data is exposed here.
        </p>
      </div>
    
  );
}
