import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { AppShellProvider } from "@/context/AppShellContext";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Unauthenticated users are strictly redirected to Sign In
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = (session.user.role ?? "user") as UserRole;

  // 2. Standard public users have no dashboard access — send to landing
  if (role === "user") {
    redirect("/");
  }

  return (
    <AppShellProvider role={role}>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </AppShellProvider>
  );
}
