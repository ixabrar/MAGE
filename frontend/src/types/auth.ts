export type UserRole = "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";

export type User = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
};

export type ModalityId = "face" | "dorsal_hand" | "blood";

export type AuthSession = {
  user: User;
  expires: string;
};

export type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  data?: AuthSession;
};
