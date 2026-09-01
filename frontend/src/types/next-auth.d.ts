import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";
    };
  }

  interface User {
    role?: "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";
  }
}
