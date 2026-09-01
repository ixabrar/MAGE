// TEMP DEV BYPASS — AUTH DISABLED
// TODO: RESTORE AUTH BEFORE PRODUCTION
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { AssessmentPageClient } from "@/components/assessment/AssessmentPageClient";

export default async function AssessmentsIndex() {
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "MAGE Development User", role: "user" } };
  } else {
    session = await auth();
  }

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={session.user}>
      <AssessmentPageClient />
    </DashboardShell>
  );
}
