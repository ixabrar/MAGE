import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ModelsClient from "./ModelsClient";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default async function ModelsPage() {
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "Admin Demo", role: "system_admin" } };
  } else {
    session = await auth();
  }
  if (!session?.user) redirect("/auth/signin");
  const role = (session.user as any).role as string;
  // both doctor and admin can view models, user not
  if (role === "user") redirect("/");
  return <ModelsClient />;
}
