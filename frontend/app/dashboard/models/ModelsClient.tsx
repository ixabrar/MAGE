"use client";

export default function ModelsClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display,'Rajdhani'),system-ui,sans-serif", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
          Model registry
        </h1>
        <p style={{ color: "#bcbac9", fontSize: "15px", lineHeight: 1.6, marginTop: "6px" }}>
          Registered modality encoders + fusion layer. Swap models without redesigning the application — adapters keep the <span className="rounded border px-1" style={{ borderColor: "#3f3a52", color: "#c9b4fa" }}>ModelPrediction</span> contract.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { group: "Face", versions: ["face-v1 (mock 0.90)", "face-v2 (real — pending)"], active: "face-v1" },
          { group: "Dorsal Hand", versions: ["dorsal-v1 (mock 0.70)", "dorsal-v2 (real — pending)"], active: "dorsal-v1" },
          { group: "Blood", versions: ["blood-v1 (mock)", "blood-v2 (real — pending)"], active: "blood-v1" },
          { group: "Fusion", versions: ["fusion-arm-pfm-v1"], active: "fusion-arm-pfm-v1" },
        ].map((g) => (
          <div key={g.group} className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
            <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
              {g.group}
            </p>
            <div className="mt-4 space-y-2">
              {g.versions.map((v) => (
                <div key={v} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm" style={{ borderColor: v === g.active ? "#c9b4fa" : "#3f3a52", background: v === g.active ? "rgba(201,180,250,0.08)" : "#0e0c1f" }}>
                  <span style={{ color: v === g.active ? "#fff" : "#bcbac9" }}>{v}</span>
                  {v === g.active && <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#7ee8c6", color: "#7ee8c6" }}>active</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Fusion layer details
        </h3>
        <pre className="mt-4 overflow-x-auto rounded-md border p-4 text-xs" style={{ borderColor: "#3f3a52", background: "#0e0c1f", color: "#bcbac9" }}>
{`ARM.compute_weights(predictions) -> ARMModelResult[]
PFM.fuse(predictions, arm_results) -> FusionResult
  fused_predicted_age, fused_confidence, fused_age_bins, model_contributions
History: arm.add_history(...) + build_profiles() seeded in fusion_service.py:35`}
        </pre>
        <p style={{ color: "#5a5772", fontSize: "12px", marginTop: "8px" }}>
          Real models replace `face_mock/dorsal_mock/blood_mock` via adapters — keep the adapter output contract.
        </p>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000" }}>
        <h3 className="text-sm uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>
          Roles & permissions (RBAC)
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ color: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Role</th>
                <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Access</th>
                <th className="px-4 py-3 text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa" }}>Sensitive data</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: "user (public)", access: "Landing + Face/Hand assessment", data: "own session only" },
                { role: "doctor / clinician", access: "Patients + Reports + Bio-age", data: "own patients only" },
                { role: "admin / system_admin", access: "Doctors + Users + Audit + Analytics", data: "aggregate only, no biometrics" },
              ].map((r) => (
                <tr key={r.role} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-4 py-3" style={{ fontWeight: 600 }}>{r.role}</td>
                  <td className="px-4 py-3" style={{ color: "#bcbac9" }}>{r.access}</td>
                  <td className="px-4 py-3" style={{ color: "#5a5772" }}>{r.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
