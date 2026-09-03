"use client";

import { useState } from "react";

type Region = {
  id: string;
  label: string;
  description: string;
  path: string;
};

const regions: Region[] = [
  {
    id: "knuckles",
    label: "Skin around the knuckles",
    description: "The model looks at wrinkles, folds, and texture around the knuckles.",
    path: "M82 142 C82 120 98 108 112 118 C120 123 122 135 116 148 C108 160 88 160 82 142 Z M132 134 C132 112 148 102 162 112 C170 118 172 130 166 143 C158 154 138 153 132 134 Z M182 138 C182 116 198 106 212 116 C220 122 222 134 216 147 C208 158 188 157 182 138 Z",
  },
  {
    id: "joints",
    label: "Finger joints",
    description: "The model looks at the shape and visibility of the finger joints.",
    path: "M88 78 L88 132 M138 62 L138 124 M188 68 L188 128 M238 88 L238 142",
  },
  {
    id: "veins",
    label: "Visible veins",
    description: "The model looks at how visible the veins and lines are on the hand.",
    path: "M108 206 C132 184 154 184 178 204 S222 222 246 196 M124 232 C148 214 170 214 194 232",
  },
];

export default function DorsalHandExplainability() {
  const [activeRegion, setActiveRegion] = useState("knuckles");
  const active = regions.find((region) => region.id === activeRegion) ?? regions[0];

  return (
    <div className="mt-6 rounded-xl border p-5" style={{ borderColor: "#3f3a52", background: "#080712" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase" style={{ letterSpacing: "1.8px", color: "#c9b4fa" }}>Interactive hand map</p>
          <p className="mt-2 text-sm" style={{ color: "#8f8aa4" }}>Select an area to see what the model looks at in the hand photo.</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-[10px] uppercase" style={{ borderColor: "#3f3a52", color: "#8f8aa4", letterSpacing: "1px" }}>Back of hand</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(180px,0.9fr)_1fr] md:items-center">
        <div className="rounded-lg border p-3" style={{ borderColor: "#242136", background: "#0e0c1f" }}>
          <svg viewBox="0 0 320 280" role="img" aria-label="Interactive dorsal hand region diagram" className="mx-auto h-auto w-full max-w-[280px]">
            <rect width="320" height="280" rx="12" fill="#121026" />
            <path d="M74 151 C67 135 70 119 80 108 L80 55 C80 43 88 35 99 35 C110 35 118 43 118 55 L118 30 C118 18 126 10 137 10 C148 10 156 18 156 30 L156 34 C156 22 164 14 175 14 C186 14 194 22 194 34 L194 52 C194 40 202 32 213 32 C224 32 232 40 232 52 L232 102 C244 109 251 119 251 134 L251 185 C251 222 224 244 188 244 L134 244 C105 244 82 227 76 201 Z" fill="#e8b978" opacity=".92" />
            <path d="M80 108 C94 97 109 98 118 110 M118 94 C130 84 145 85 156 97 M156 98 C169 88 182 89 194 101 M194 116 C207 107 220 111 232 123" fill="none" stroke="#fff1d4" strokeWidth="3" opacity=".55" />
            {regions.map((region) => (
              <path
                key={region.id}
                d={region.path}
                fill={region.id === "knuckles" ? "#f06c45" : "none"}
                stroke={region.id === activeRegion ? "#fff4cf" : "#f0a33a"}
                strokeWidth={region.id === activeRegion ? 5 : 3}
                strokeLinecap="round"
                opacity={region.id === activeRegion ? 1 : .42}
                tabIndex={0}
                role="button"
                aria-label={region.label}
                onMouseEnter={() => setActiveRegion(region.id)}
                onFocus={() => setActiveRegion(region.id)}
                onClick={() => setActiveRegion(region.id)}
              />
            ))}
            <circle cx="160" cy="178" r="24" fill="#f0a33a" opacity={activeRegion === "veins" ? .9 : .35} />
          </svg>
        </div>

        <div className="space-y-3">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => setActiveRegion(region.id)}
              onMouseEnter={() => setActiveRegion(region.id)}
              className="w-full rounded-lg border p-3 text-left transition-colors"
              style={{ borderColor: activeRegion === region.id ? "#c9b4fa" : "#3f3a52", background: activeRegion === region.id ? "rgba(201,180,250,.1)" : "transparent" }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#ffffff" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: activeRegion === region.id ? "#f06c45" : "#f0a33a" }} />
                {region.label}
              </span>
              <span className="mt-1 block text-xs" style={{ color: "#8f8aa4" }}>{region.description}</span>
            </button>
          ))}
          <div className="border-t pt-3" style={{ borderColor: "#242136" }}>
            <p className="text-xs uppercase" style={{ letterSpacing: "1.2px", color: "#8f8aa4" }}>What this means</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "#f0a33a" }}>{active.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
