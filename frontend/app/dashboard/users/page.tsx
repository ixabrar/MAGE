const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UsersClient from "./UsersClient";

export default async function DashboardUsersPage() {
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "MAGE Development User", role: "system_admin" } };
  } else {
    session = await auth();
  }
  if (!session?.user) redirect("/login");
  // Optional: restrict to admin in real prod — for now allow all but UI notes admin-only
  return <UsersClient />;
}
