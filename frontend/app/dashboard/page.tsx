"use client";

import { useState } from "react";

const stats = [
  { label: "Assessments", value: "12" },
  { label: "Models active", value: "4" },
  { label: "Fusion runs", value: "8" },
  { label: "Data sources", value: "3" },
];

const recent = [
  { id: "A-001", date: "2026-08-31", modalities: "Face + Hand + Blood", status: "Completed", estimate: "27.4" },
  { id: "A-002", date: "2026-08-30", modalities: "Face + Hand", status: "Processing", estimate: "—" },
  { id: "A-003", date: "2026-08-29", modalities: "Face", status: "Completed", estimate: "29.0" },
];

export default function DashboardIndexClient() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? recent : recent.filter((item) => item.status.toLowerCase() === filter);

  return (
    <div className="space-y-8">
      <h1
        style={{
          fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
          fontSize: "40px",
          fontWeight: 700,
          lineHeight: 1.1,
          color: "#ffffff",
        }}
      >
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border p-6" style={{ borderColor: "#3f3a52", background: "#000000" }}>
            <p
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "12px",
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: "#c9b4fa",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#ffffff",
                marginTop: "8px",
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-8" style={{ borderColor: "#3f3a52", background: "#000000" }}>
        <div className="flex flex-wrap items-center gap-3">
          <h2
            style={{
              fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#ffffff",
            }}
          >
            Recent assessments
          </h2>
          {["all", "completed", "processing"].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "13px",
                borderColor: filter === option ? "#c9b4fa" : "#3f3a52",
                color: filter === option ? "#ffffff" : "#bcbac9",
                background: filter === option ? "rgba(201,180,250,0.15)" : "transparent",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: "14px", color: "#ffffff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #3f3a52" }}>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>ID</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Date</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Modalities</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Status</th>
                <th className="px-6 py-4" style={{ fontSize: "12px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#c9b4fa" }}>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #3f3a52" }}>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.id}</td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.date}</td>
                  <td className="px-6 py-4">{item.modalities}</td>
                  <td className="px-6 py-4">
                    <span
                      className="rounded-full border px-3 py-1"
                      style={{
                        borderColor: item.status === "Completed" ? "#c9b4fa" : "#3f3a52",
                        color: item.status === "Completed" ? "#c9b4fa" : "#bcbac9",
                        fontSize: "12px",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#bcbac9" }}>{item.estimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
