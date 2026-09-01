// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardUsersPage() {
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
          Users
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9" }}>
          Manage users and roles. Raw sensitive data access remains restricted and audited.
        </p>
        <div className="border" style={{ borderColor: "#3f3a52", background: "#000000" }}>
          <table className="w-full text-left" style={{ fontSize: "14px", color: "#ffffff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Name</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Email</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Role</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Abrar shaikh", email: "abrar@example.com", role: "user", status: "active" },
                { name: "Clinician One", email: "clinician@example.com", role: "clinician", status: "active" },
              ].map((user) => (
                <tr key={user.email} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{user.email}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{user.role}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border px-3 py-1" style={{ borderColor: "#c9b4fa", color: "#c9b4fa", fontSize: "12px" }}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
  );
}
