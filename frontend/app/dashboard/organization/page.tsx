import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OrganizationsClient from "../organizations/OrganizationsClient";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default async function OrganizationPage() {
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "Admin Demo", role: "system_admin" } };
  } else {
    session = await auth();
  }
  if (!session?.user) redirect("/auth/signin");
  const role = (session.user as any).role as string;
  if (role === "doctor" || role === "clinician") redirect("/dashboard/patients");
  if (role === "user") redirect("/");
  return <OrganizationsClient />;
}
