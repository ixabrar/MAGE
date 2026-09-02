"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPatients, createPatient, deletePatient, updatePatient, type Patient } from "@/lib/api";
import { getStoredUser } from "@/lib/authStore";
import { mockListPatients, mockCreatePatient, mockUpdatePatient, mockDeletePatient } from "@/lib/mockPatients";

function ageFromDob(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", date_of_birth: "", gender: "male", contact_number: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    setOffline(false);
    try {
      const data = await listPatients().catch(async (e: any) => {
        const t = typeof window !== "undefined" ? localStorage.getItem("mage_access_token") : null;
        if (!t) {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const r = await fetch(`${base}/api/patients/`);
          if (!r.ok) throw new Error("Failed to load patients — please login as doctor.");
          return r.json();
        }
        throw e;
      });
      const arr = Array.isArray(data) ? data : data?.patients ?? data ?? [];
      // if backend returns empty and we have mock data, merge for demo continuity
      if (arr.length === 0) {
        const mock = mockListPatients();
        if (mock.length > 0) {
          setPatients(mock);
          setOffline(true);
          return;
        }
      }
      setPatients(arr);
    } catch (e: any) {
      // offline/demo fallback — use local storage mock (Supabase dummy → 500 ConnectError)
      const mock = mockListPatients();
      setPatients(mock);
      setOffline(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = patients.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || p.contact_number?.toLowerCase().includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth) {
      setError("Please fill required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        try {
          await updatePatient(editing.id, form);
        } catch (err: any) {
          const msg = String(err?.message || "").toLowerCase();
          if (msg.includes("internal") || msg.includes("500") || msg.includes("failed to fetch") || msg.includes("connect")) {
            const m = mockUpdatePatient(editing.id, form);
            if (!m) throw err;
            setOffline(true);
          } else throw err;
        }
      } else {
        try {
          await createPatient(form);
        } catch (err: any) {
          const msg = String(err?.message || "").toLowerCase();
          if (msg.includes("internal") || msg.includes("500") || msg.includes("failed to fetch") || msg.includes("connect") || msg.includes("supabase") || (err as any)?.status >= 500) {
            mockCreatePatient(form);
            setOffline(true);
          } else throw err;
        }
      }
      setShowAdd(false);
      setEditing(null);
      setForm({ first_name: "", last_name: "", date_of_birth: "", gender: "male", contact_number: "", email: "" });
      await load();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth?.slice(0, 10) || "",
      gender: p.gender || "male",
      contact_number: p.contact_number || "",
      email: p.email || "",
    });
    setShowAdd(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this patient? This will also delete history.")) return;
    try {
      try {
        await deletePatient(id);
      } catch (err: any) {
        const msg = String(err?.message || "").toLowerCase();
        if (msg.includes("internal") || msg.includes("500") || msg.includes("failed to fetch") || msg.includes("connect")) {
          const ok = mockDeletePatient(id);
          if (!ok) throw err;
          setOffline(true);
        } else throw err;
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <p style={{ color: "#bcbac9", fontSize: "14px" }}>Loading patients…</p>
        <div className="h-32 rounded-xl border animate-pulse" style={{ borderColor: "#3f3a52", background: "#000" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
              fontSize: "40px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            Patients
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9", marginTop: "6px" }}>
            Access only assigned patients. Sensitive biometric data remains protected.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ first_name: "", last_name: "", date_of_birth: "", gender: "male", contact_number: "", email: "" });
            setShowAdd(true);
          }}
          className="rounded-full px-6 py-2.5 text-sm font-semibold"
          style={{ background: "#c9b4fa", color: "#1b1938", fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 700 }}
        >
          + Add patient
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:max-w-sm rounded-md border bg-black px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: "#3f3a52", color: "#ffffff" }}
        />
        <span style={{ color: "#5a5772", fontSize: "13px" }}>{filtered.length} patient{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {offline && (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#c9b4fa", color: "#c9b4fa", background: "rgba(201,180,250,0.08)" }}>
          Offline demo mode — patients stored locally in your browser. Tell your friend to set real <span style={{ color: "#fff" }}>SUPABASE_URL/ANON_KEY</span> in <span style={{ color: "#fff" }}>backend/.env</span> for persistence.
        </div>
      )}
      {error && (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#ff8a8a", color: "#ff8a8a", background: "rgba(255,138,138,0.08)" }}>
          {error} — <button onClick={load} className="underline">Retry</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: 600 }}>No patients yet</p>
          <p style={{ color: "#bcbac9", fontSize: "14px", marginTop: "6px" }}>
            Add your first patient to start bio-age assessments.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <table className="w-full text-left" style={{ fontSize: "14px", color: "#ffffff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Patient</th>
                <th className="px-6 py-4 text-xs uppercase hidden md:table-cell" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>DOB / Age</th>
                <th className="px-6 py-4 text-xs uppercase hidden sm:table-cell" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Gender</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Contact</th>
                <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/patients/${p.id}`} className="hover:underline" style={{ color: "#ffffff", fontWeight: 600 }}>
                      {p.first_name} {p.last_name}
                    </Link>
                    <div className="md:hidden text-xs" style={{ color: "#bcbac9" }}>{p.date_of_birth?.slice(0,10)} · {p.date_of_birth ? ageFromDob(p.date_of_birth) + "y" : "—"}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell" style={{ color: "#bcbac9" }}>{p.date_of_birth?.slice(0,10)} · {p.date_of_birth ? ageFromDob(p.date_of_birth) + "y" : "—"}</td>
                  <td className="px-6 py-4 hidden sm:table-cell" style={{ color: "#bcbac9" }}>{p.gender}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{p.contact_number || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/patients/${p.id}`} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>
                        Open
                      </Link>
                      <button onClick={() => openEdit(p)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#c9b4fa", color: "#c9b4fa" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#ff8a8a", color: "#ff8a8a" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-lg rounded-xl border p-6" style={{ background: "#0e0c1f", borderColor: "#3f3a52" }}>
            <h3 style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700 }}>{editing ? "Edit patient" : "Add new patient"}</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>First name *</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                </div>
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Last name *</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Date of birth *</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                </div>
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Contact number</label>
                  <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="+91…" className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                </div>
                <div>
                  <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Email address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@example.com" className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditing(null); }} className="rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}>{submitting ? "Saving…" : editing ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
