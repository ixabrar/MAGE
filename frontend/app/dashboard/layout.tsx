import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { AppShellProvider } from "@/context/AppShellContext";
import { DashboardShell } from "@/components/DashboardShell";

// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

const DEV_USER = {
  id: "dev_user",
  email: "mage.dev@example.com",
  name: "MAGE Development User",
  role: "user",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  if (DEV_BYPASS) {
    session = { user: DEV_USER };
  } else {
    session = await auth();
  }

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user.role ?? "user") as UserRole;

  return (
    <AppShellProvider role={role}>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </AppShellProvider>
  );
}
