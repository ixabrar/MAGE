"use client";

import { useEffect, useState } from "react";
import { listDoctors, createDoctor, deleteDoctor, enableDoctor, type Doctor } from "@/lib/api";
import { listPatients } from "@/lib/api";

export default function UsersClient() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"doctors" | "patients" | "roles">("doctors");
  const [patientsCount, setPatientsCount] = useState<string>("—");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listDoctors().catch(async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/admin/doctors`);
        if (!r.ok) throw new Error("Failed to load doctors — admin only");
        const j = await r.json();
        return j as { doctors: Doctor[] };
      });
      setDoctors(res.doctors || []);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/patients/`);
        if (r.ok) {
          const j = await r.json();
          const len = Array.isArray(j) ? j.length : j?.length ?? j?.patients?.length ?? "—";
          setPatientsCount(String(len));
        }
      } catch {}
    } catch (e: any) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      setError("All fields required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createDoctor(form).catch(async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/admin/doctors`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.detail || j.error || "Create failed");
        }
        return r.json();
      });
      setShowAdd(false);
      setForm({ full_name: "", email: "", password: "" });
      await load();
    } catch (e: any) {
      setError(e.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Disable this doctor?")) return;
    try {
      await deleteDoctor(id).catch(async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/admin/doctors/${id}`, { method: "DELETE" });
        if (!r.ok) throw new Error("Disable failed");
        return r.json();
      });
      await load();
    } catch (e: any) {
      setError(e.message || "Disable failed");
    }
  }

  async function handleEnable(id: string) {
    if (!confirm("Enable this doctor?")) return;
    try {
      await enableDoctor(id).catch(async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const r = await fetch(`${base}/api/admin/doctors/${id}/enable`, { method: "POST" });
        if (!r.ok) throw new Error("Enable failed");
        return r.json();
      });
      await load();
    } catch (e: any) {
      setError(e.message || "Enable failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>Users</h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#bcbac9", marginTop: "6px" }}>Admin: manage doctors, users, and roles. Patient health data is anonymized or hidden here.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}>+ Add doctor</button>
      </div>

      <div className="flex gap-2">
        {[
          { id: "doctors", label: `Doctors (${doctors.length})` },
          { id: "patients", label: `Patients (${patientsCount})` },
          { id: "roles", label: "Roles" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{
              borderColor: tab === t.id ? "#c9b4fa" : "#3f3a52",
              color: tab === t.id ? "#fff" : "#bcbac9",
              background: tab === t.id ? "rgba(201,180,250,0.15)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#ff8a8a", color: "#ff8a8a", background: "rgba(255,138,138,0.08)" }}>{error}</div>}

      {tab === "doctors" && (
        <div className="rounded-xl border" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "#3f3a52" }}>
            <span style={{ color: "#bcbac9", fontSize: "13px" }}>{loading ? "Loading…" : `${doctors.length} doctor${doctors.length !== 1 ? "s" : ""}`}</span>
            <button onClick={load} className="text-xs underline" style={{ color: "#c9b4fa" }}>Refresh</button>
          </div>
          {loading ? (
            <div className="p-8 text-center" style={{ color: "#5a5772" }}>Loading doctors…</div>
          ) : doctors.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ color: "#fff", fontWeight: 600 }}>No doctors yet</p>
              <p style={{ color: "#5a5772", fontSize: "14px", marginTop: "6px" }}>Create the first doctor account to enable patient management.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                    <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Name</th>
                    <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Email</th>
                    <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Role</th>
                    <th className="px-6 py-4 text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #3f3a52", opacity: d.is_active === false ? 0.5 : 1 }}>
                      <td className="px-6 py-4">
                        {d.full_name}
                        {d.is_active === false && <span className="ml-2 text-xs text-[#ff8a8a]">(Disabled)</span>}
                      </td>
                      <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{d.email || "—"}</td>
                      <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{d.role}</td>
                      <td className="px-6 py-4">
                        {d.is_active === false ? (
                          <button onClick={() => handleEnable(d.id)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#7ee8c6", color: "#7ee8c6" }}>Enable</button>
                        ) : (
                          <button onClick={() => handleDelete(d.id)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#ff8a8a", color: "#ff8a8a" }}>Disable</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "patients" && (
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            Patients — anonymized overview (admin)
          </h3>
          <p style={{ color: "#5a5772", fontSize: "13px", marginTop: "6px" }}>Admin sees only counts & anonymized ages — no names, images, or report blobs. Doctors see full records for their assigned patients.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Total patients</p>
              <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{patientsCount}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Data access</p>
              <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>Aggregate only</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "#3f3a52", background: "#0e0c1f" }}>
              <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#bcbac9" }}>Policy</p>
              <p style={{ color: "#7ee8c6", fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>No raw biometrics</p>
            </div>
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
          <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
            Roles & permissions
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Role</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Dashboard</th>
                  <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "user (public)", dash: "None — landing only", data: "Own assessment only" },
                  { role: "doctor", dash: "Patients / Assessments / History", data: "Own patients’ full records" },
                  { role: "admin / system_admin", dash: "Users / Analytics / Organizations / Audit / Models", data: "Counts & anonymized only" },
                ].map((r) => (
                  <tr key={r.role} style={{ borderBottom: "1px solid #3f3a52" }}>
                    <td className="px-4 py-3" style={{ fontWeight: 600 }}>{r.role}</td>
                    <td className="px-4 py-3" style={{ color: "#bcbac9" }}>{r.dash}</td>
                    <td className="px-4 py-3" style={{ color: "#5a5772" }}>{r.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "10px" }}>When your friend adds `GET /api/admin/roles`, this table can be driven from backend.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md rounded-xl border p-6" style={{ background: "#0e0c1f", borderColor: "#3f3a52" }}>
            <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>Add doctor</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Full name *</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
              </div>
              <div>
                <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
              </div>
              <div>
                <label className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-2 w-full rounded-md border bg-black px-4 py-2.5 text-sm outline-none" style={{ borderColor: "#3f3a52", color: "#fff" }} />
                <p style={{ color: "#5a5772", fontSize: "11px", marginTop: "4px" }}>Stored securely via Supabase Auth (not plain text).</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: "#3f3a52", color: "#bcbac9" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}>{submitting ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
