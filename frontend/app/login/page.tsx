import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/auth/signin");
}
