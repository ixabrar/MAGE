"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
}

interface AppShellContextValue {
  role: UserRole;
  navigation: NavItem[];
}

const NAVIGATION: Record<UserRole, NavItem[]> = {
  user: [], // General user has no dashboard — public landing only per spec
  clinician: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/patients", label: "Patients" },
    { href: "/dashboard/assessments", label: "Assessments" },
    { href: "/dashboard/history", label: "History" },
  ],
  doctor: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/patients", label: "Patients" },
    { href: "/dashboard/assessments", label: "Assessments" },
    { href: "/dashboard/history", label: "History" },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/users", label: "Users" },
    { href: "/dashboard/organizations", label: "Organizations" },
    { href: "/dashboard/models", label: "Models" },
    { href: "/dashboard/audit", label: "Audit Logs" },
  ],
  organization_admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/users", label: "Users" },
    { href: "/dashboard/organization", label: "Organization" },
    { href: "/dashboard/analytics", label: "Analytics" },
  ],
  ml_researcher: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/models", label: "Models" },
    { href: "/dashboard/experiments", label: "Experiments" },
    { href: "/dashboard/datasets", label: "Datasets" },
  ],
  system_admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/users", label: "Users" },
    { href: "/dashboard/organizations", label: "Organizations" },
    { href: "/dashboard/models", label: "Models" },
    { href: "/dashboard/audit", label: "Audit Logs" },
  ],
};

const AppShellContext = createContext<AppShellContextValue>({ role: "user", navigation: NAVIGATION.user });

export function AppShellProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const navigation = NAVIGATION[role] ?? NAVIGATION.user;

  return (
    <AppShellContext.Provider value={{ role, navigation }}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useRole() {
  return useContext(AppShellContext).role;
}

export function useAppShell() {
  return useContext(AppShellContext);
}
