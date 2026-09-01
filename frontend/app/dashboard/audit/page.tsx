// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardAuditPage() {
  let session;
if (DEV_BYPASS) {
  session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "MAGE Development User", role: "user" } };
} else {
  session = await auth();
}
  if (!session?.user) redirect("/login");

  const events = [
    { id: "E-001", action: "USER_LOGIN", actor: session.user.email, resource: "session", result: "success", timestamp: "2026-08-31T10:24:00Z" },
    { id: "E-002", action: "ASSESSMENT_CREATED", actor: session.user.email, resource: "A-001", result: "success", timestamp: "2026-08-31T10:26:00Z" },
    { id: "E-003", action: "FACE_UPLOADED", actor: session.user.email, resource: "A-001", result: "success", timestamp: "2026-08-31T10:26:30Z" },
  ];

  return (
    
      <div className="space-y-6">
        <h1 style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.1, color: "#ffffff" }}>Audit logs</h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9" }}>
          Review protected actions. Raw biometric content is never exposed in logs.
        </p>
        <div className="border" style={{ borderColor: "#3f3a52", background: "#000000" }}>
          <table className="w-full text-left" style={{ fontSize: "14px", color: "#ffffff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>ID</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Action</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Actor</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Resource</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Result</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{event.id}</td>
                  <td className="px-6 py-4">{event.action}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{event.actor}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{event.resource}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border px-3 py-1" style={{ borderColor: "#c9b4fa", color: "#c9b4fa", fontSize: "12px" }}>
                      {event.result}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{event.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
  );
}
