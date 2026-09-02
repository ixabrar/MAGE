"use client";

import type { Patient, PatientHistoryRecord } from "./api";

const STORAGE_KEY = "mage_mock_patients";

function readStore(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeStore(patients: Patient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

export function mockListPatients(): Patient[] {
  return readStore();
}

export function mockCreatePatient(data: { first_name: string; last_name: string; date_of_birth: string; gender: string; contact_number?: string }): Patient {
  const patients = readStore();
  const now = new Date().toISOString();
  const p: Patient = {
    id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    doctor_id: "00000000-0000-0000-0000-000000000001",
    first_name: data.first_name,
    last_name: data.last_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    contact_number: data.contact_number,
    created_at: now,
    updated_at: now,
    history: [],
  };
  patients.push(p);
  writeStore(patients);
  return p;
}

export function mockGetPatient(id: string): Patient | null {
  return readStore().find((p) => p.id === id) || null;
}

export function mockUpdatePatient(id: string, data: Partial<Pick<Patient, "first_name" | "last_name" | "date_of_birth" | "gender" | "contact_number">>): Patient | null {
  const patients = readStore();
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated = { ...patients[idx], ...data, updated_at: new Date().toISOString() };
  if (data.date_of_birth) updated.date_of_birth = data.date_of_birth;
  patients[idx] = updated as Patient;
  writeStore(patients);
  return patients[idx];
}

export function mockDeletePatient(id: string): boolean {
  const patients = readStore();
  const next = patients.filter((p) => p.id !== id);
  if (next.length === patients.length) return false;
  writeStore(next);
  return true;
}

export function mockAddHistory(patientId: string, data: Partial<Pick<PatientHistoryRecord, "chronological_age" | "predicted_bio_age" | "bio_age_gap" | "ai_summary" | "doctor_remarks">>): PatientHistoryRecord | null {
  const patients = readStore();
  const idx = patients.findIndex((p) => p.id === patientId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const rec: PatientHistoryRecord = {
    id: `h_${Date.now()}`,
    patient_id: patientId,
    doctor_id: patients[idx].doctor_id as any,
    record_date: now,
    chronological_age: data.chronological_age ?? null,
    predicted_bio_age: data.predicted_bio_age ?? null,
    bio_age_gap: data.bio_age_gap ?? null,
    ai_summary: data.ai_summary ?? null,
    doctor_remarks: data.doctor_remarks ?? null,
    created_at: now,
  };
  const p = patients[idx];
  p.history = [...(p.history || []), rec];
  p.updated_at = now;
  writeStore(patients);
  return rec;
}

export function isBackendUnavailableError(e: any): boolean {
  const msg = String(e?.message || e || "").toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("connecterror") || msg.includes("internal") || msg.includes("500") || (e as any)?.status === 500;
}
