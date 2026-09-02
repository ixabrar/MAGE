import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PatientDetailClient from "./PatientDetailClient";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session;
  if (DEV_BYPASS) {
    session = { user: { id: "dev_user", email: "mage.dev@example.com", name: "MAGE Development User", role: "doctor" } };
  } else {
    session = await auth();
  }
  if (!session?.user) redirect("/login");
  return <PatientDetailClient patientId={id} />;
}
