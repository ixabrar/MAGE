import "next-auth";
import "next-auth/jwt";

type AppRole = "user" | "clinician" | "doctor" | "admin" | "organization_admin" | "ml_researcher" | "system_admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: AppRole;
    };
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
  }
}
