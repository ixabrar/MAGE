"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type FetchOpts = RequestInit & { auth?: boolean };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mage_access_token");
}

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };
  // Only set json content-type if body is not FormData
  if (!(opts.body instanceof FormData) && !headers["content-type"] && !headers["Content-Type"]) {
    headers["content-type"] = "application/json";
  }
  if (opts.auth !== false) {
    let t = getToken();
    if (!t && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      t = "test";
    }
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = await res.json();
      detail = j?.detail || j?.error || j?.message || JSON.stringify(j);
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail || `Request failed ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

// Auth
export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; full_name: string; role: string };
};

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

// Patients
export type PatientCreate = {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date yyyy-mm-dd
  gender: string;
  contact_number?: string;
  email?: string;
};
export type Patient = PatientCreate & {
  id: string;
  doctor_id: string;
  contact_number: string | null;
  created_at: string;
  is_active?: boolean;
  history: PatientHistoryRecord[];
};
export type PatientHistoryRecord = {
  id: string;
  patient_id: string;
  doctor_id: string;
  record_date: string;
  chronological_age?: number | null;
  predicted_bio_age?: number | null;
  bio_age_gap?: number | null;
  ai_summary?: string | null;
  doctor_remarks?: string | null;
  created_at: string;
};

export function listPatients(): Promise<Patient[]> {
  return apiFetch("/api/patients/", { auth: true });
}
export function getPatient(id: string): Promise<Patient> {
  return apiFetch(`/api/patients/${id}`, { auth: true });
}
export function createPatient(data: PatientCreate): Promise<Patient> {
  return apiFetch("/api/patients/", { method: "POST", body: JSON.stringify(data), auth: true });
}
export function updatePatient(id: string, data: Partial<PatientCreate>): Promise<Patient> {
  return apiFetch(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(data), auth: true });
}
export function deletePatient(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/patients/${id}`, { method: "DELETE", auth: true });
}

export function enablePatient(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/patients/${id}/enable`, { method: "POST", auth: true });
}
export function addPatientHistory(
  patientId: string,
  data: Partial<Pick<PatientHistoryRecord, "chronological_age" | "predicted_bio_age" | "bio_age_gap" | "ai_summary" | "doctor_remarks">>
): Promise<PatientHistoryRecord> {
  return apiFetch(`/api/patients/${patientId}/history`, {
    method: "POST",
    body: JSON.stringify(data),
    auth: true,
  });
}
export async function uploadHistoryPdf(historyId: string, blob: Blob): Promise<{ status: string; message: string }> {
  const fd = new FormData();
  fd.append("file", blob, "report.pdf");
  return apiFetch(`/api/patients/history/${historyId}/pdf`, { method: "POST", body: fd, auth: true });
}
export async function viewHistoryPdf(historyId: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/patients/history/${historyId}/pdf`, { headers });
  if (!res.ok) throw new Error("PDF not found or unauthorized");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// Assessment (public)
export type AssessmentRequest = {
  modalities: string[];
  inputs: Record<string, { type: string; file_url: string | null }>;
  context?: Record<string, number | null>;
  patient_id?: string | null;
};
export type AssessmentResponse = {
  assessment_id: string;
  status: string;
  result: {
    fused_predicted_age: number;
    fused_confidence: number;
    fused_age_bins: Record<string, number>;
    model_contributions: Record<string, number>;
  } | null;
  created_at: string;
};
export function createAssessment(payload: AssessmentRequest): Promise<AssessmentResponse> {
  return apiFetch("/api/assessment", { method: "POST", body: JSON.stringify(payload), auth: false });
}
export function getAssessment(id: string): Promise<AssessmentResponse & { result: AssessmentResponse["result"] }> {
  return apiFetch(`/api/assessment/${id}`, { auth: false });
}

// Reports / prediction — backend now has real XGBoost + SHAP + PDF
// Mock fallback remains for offline demo when Supabase dummy or endpoint missing
export type ExtractedFeature = {
  name: string;
  value: number | string;
  unit?: string;
  reference_range?: string;
  status: "low" | "normal" | "high";
  gap_effect: "positive" | "negative" | "neutral";
  importance: number; // 0-1
  interpretation?: string;
};
export type ReportUploadResponse = {
  report_id: string;
  extracted_features: ExtractedFeature[];
};
export async function uploadReport(patientId: string, file: File): Promise<ReportUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch(`/api/patients/${patientId}/reports`, { method: "POST", body: fd, auth: true });
}
export type BioAgePrediction = {
  chronological_age: number;
  predicted_bio_age: number;
  bio_age_gap: number;
  contributing_factors: { feature: string; direction: string; strength: number }[];
  ai_summary: string;
  recommendations: { feature: string; text: string }[];
};
// Real backend: 77-field XGBoost model (SHAP) — all optional floats
export type BioAgePredictionRequest = Partial<{
  CRP: number; LBDEONO: number; LBDHDD: number; LBDLYMNO: number; LBDMONO: number; LBDNENO: number; LBXBAPCT: number; LBXEOPCT: number;
  LBXGH: number; LBXHCT: number; LBXHGB: number; LBXLYPCT: number; LBXMC: number; LBXMCHSI: number; LBXMCVSI: number; LBXMOPCT: number;
  LBXMPSI: number; LBXNEPCT: number; LBXPLTSI: number; LBXRBCSI: number; LBXRDW: number; LBXSAL: number; LBXSAPSI: number; LBXSASSI: number;
  LBXSATSI: number; LBXSBU: number; LBXSC3SI: number; LBXSCA: number; LBXSCH: number; LBXSCLSI: number; LBXSCR: number; LBXSGB: number;
  LBXSGL: number; LBXSGTSI: number; LBXSIR: number; LBXSKSI: number; LBXSLDSI: number; LBXSNASI: number; LBXSOSSI: number; LBXSPH: number;
  LBXSTB: number; LBXSTP: number; LBXSUA: number; LBXTC: number; LBXWBCSI: number; URXCRS: number; URXUCR: number; URXUMA: number; URXUMS: number;
  URDACT: number; LBXSCK: number; Gender: number; Weight: number; Height: number; Waist: number; Systolic_BP: number; Alcohol_days: number;
  Exercise_days: number; LBXGLU: number; Smoking_status_Former: number; Smoking_status_Never: number; log_CRP: number; log_LBXSAPSI: number;
  log_LBXWBCSI: number; log_LBXGH: number; log_LBXSCR: number; log_LBXGLU: number; chol_ratio: number; non_hdl: number; scr_albumin_ratio: number;
  inflam_score: number; NLR_proxy: number; glycation_gap: number; LBXRDW_sq: number; LBXMCVSI_sq: number; BMI: number; WHtR: number;
}>;

export async function predictBioAge(patientId: string, reportId?: string, features?: ExtractedFeature[]): Promise<BioAgePrediction> {
  // legacy mock endpoint — keep for offline demo fallback
  return apiFetch(`/api/patients/${patientId}/predict`, {
    method: "POST",
    body: JSON.stringify({ report_id: reportId, features }),
    auth: true,
  });
}

// Real endpoint: POST /api/patients/{id}/predict-bio-age → application/pdf (streaming)
// Payload is BioAgePredictionRequest (77 optional floats), chronological_age is derived from patient DOB on backend
export async function predictBioAgePdf(patientId: string, payload: BioAgePredictionRequest): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/predict-bio-age`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = await res.json();
      detail = j?.detail || JSON.stringify(j);
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail || `predict-bio-age failed ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return await res.blob();
}

export async function emailReport(patientId: string): Promise<{ status: string; message: string }> {
  return apiFetch(`/api/patients/${patientId}/email-report`, { method: "POST", auth: true });
}

// Dorsal hand — ResNet18 (resnet18_consistent_age_best.pth)
export type DorsalHandPrediction = {
  model_name: string;
  predicted_age: number;
  confidence: number;
  age_bins: Record<string, number>;
  source: string;
};

export async function predictDorsalHand(file: File): Promise<DorsalHandPrediction> {
  const fd = new FormData();
  fd.append("file", file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Don't set content-type — browser will set multipart boundary
  const res = await fetch(`${API_BASE}/api/predict/dorsal-hand`, {
    method: "POST",
    headers,
    body: fd,
  });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = await res.json();
      detail = (j as any)?.detail || JSON.stringify(j);
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail || `Dorsal hand prediction failed ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

// Admin
export type Doctor = { id: string; email: string | null; full_name: string; role: string; is_active?: boolean };
export function listDoctors(): Promise<{ doctors: Doctor[] }> {
  return apiFetch("/api/admin/doctors", { auth: true });
}
export function createDoctor(data: { email: string; password: string; full_name: string }): Promise<{ message: string; doctor: Doctor }> {
  return apiFetch("/api/admin/doctors", { method: "POST", body: JSON.stringify(data), auth: true });
}
export function deleteDoctor(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/admin/doctors/${id}`, { method: "DELETE", auth: true });
}

export function enableDoctor(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/admin/doctors/${id}/enable`, { method: "POST", auth: true });
}

export const API_BASE_URL = API_BASE;
