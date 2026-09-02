// Fallback mocks for report/bio-age when backend not yet implemented.
// Keeps frontend functional without backend changes.

import type { ExtractedFeature, BioAgePrediction } from "./api";

export function mockFeaturesFromFile(name: string): ExtractedFeature[] {
  // deterministic simple mock based on filename hash
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const mk = (n: string, v: number, range: string, status: ExtractedFeature["status"], effect: ExtractedFeature["gap_effect"], imp: number): ExtractedFeature => ({
    name: n,
    value: v,
    reference_range: range,
    status,
    gap_effect: effect,
    importance: imp,
    interpretation: status === "high" ? "Higher value may contribute to increased bio-age gap." : status === "low" ? "Lower value may contribute to decreased bio-age gap." : "Within normal range.",
  });
  // vary slightly by seed
  return [
    mk("Blood glucose", 95 + (seed % 20), "70-99 mg/dL", seed % 3 === 0 ? "high" as const : "normal" as const, seed % 2 === 0 ? "negative" as const : "positive" as const, 0.82),
    mk("Total cholesterol", 180 + (seed % 30), "125-200 mg/dL", seed % 4 === 0 ? "high" as const : "normal" as const, "negative" as const, 0.64),
    mk("HDL", 55 - (seed % 10), "40-60 mg/dL", "normal" as const, "positive" as const, 0.41),
    mk("Systolic BP", 118 + (seed % 18), "90-120 mmHg", seed % 5 === 0 ? "high" as const : "normal" as const, "negative" as const, 0.71),
    mk("BMI", 23.5 + ((seed % 8) - 4) * 0.5, "18.5-24.9", seed % 3 === 1 ? "high" as const : "normal" as const, seed % 3 === 1 ? "negative" as const : "positive" as const, 0.55),
  ];
}

export function mockBioAgePrediction(chronological: number, features: ExtractedFeature[]): BioAgePrediction {
  const highCount = features.filter((f) => f.status === "high").length;
  const gap = Number(((highCount * 1.8) - 1.2 + (Math.random() * 0.8 - 0.4)).toFixed(1));
  const predicted = Number((chronological + gap).toFixed(1));
  const factors = features
    .filter((f) => f.status !== "normal")
    .slice(0, 3)
    .map((f) => ({
      feature: f.name,
      direction: f.gap_effect === "negative" ? "increases gap" : "decreases gap",
      strength: f.importance,
    }));
  if (factors.length === 0) {
    factors.push({ feature: features[0].name, direction: "neutral", strength: 0.3 });
  }
  return {
    chronological_age: chronological,
    predicted_bio_age: predicted,
    bio_age_gap: gap,
    contributing_factors: factors,
    ai_summary: `Patient's predicted biological age is ${predicted} years vs chronological ${chronological} years (gap ${gap > 0 ? "+" : ""}${gap}). Major contributors: ${factors.map((f) => f.feature).join(", ")}.`,
    recommendations: features
      .filter((f) => f.status === "high")
      .map((f) => ({
        feature: f.name,
        text: `Discuss ${f.name} (${f.value}) with clinician; general lifestyle review recommended. Informational only — requires qualified medical review.`,
      }))
      .slice(0, 3),
  };
}

// simple age from dob
export function ageFromDob(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
