import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AssessmentsClient from "./AssessmentsClient";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default async function AssessmentsPage() {
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "Dr. Demo", role: "doctor" } };
  } else {
    session = await auth();
  }
  if (!session?.user) redirect("/auth/signin");
  const role = (session.user as any).role as string;
  if (role === "admin" || role === "system_admin") redirect("/dashboard/users");
  if (role === "user") redirect("/");
  return <AssessmentsClient />;
}
