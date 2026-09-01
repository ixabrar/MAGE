export type UserRole = "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface Assessment {
  id: string;
  userId: string;
  modalities: string[];
  status: "draft" | "queued" | "processing" | "completed" | "failed";
  result?: {
    estimatedAge: number;
    chronologicalAge: number;
    difference: number;
  };
  modelVersions?: {
    face?: string;
    hand?: string;
    blood?: string;
    fusion?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type Modality = "face" | "dorsal_hand" | "blood";
