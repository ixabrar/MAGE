export const FUSION_MIN_MODEL_WEIGHT = 0.25;

export type AgeBin = "18-25" | "26-35" | "36-45" | "46+";

export interface ModelPrediction {
  model_name: string;
  predicted_age: number;
  confidence: number;
  age_bins: Record<AgeBin, number>;
}

export interface ARMModelResult {
  model_name: string;
  historical_reliability: number;
  evidence_strength: number;
  confidence_cap: number;
  reliability: number;
  weight: number;
}

export interface FusionResult {
  fused_predicted_age: number;
  fused_confidence: number;
  fused_age_bins: Record<AgeBin, number>;
  model_contributions: Record<string, number>;
}

export type ScenarioId = "young" | "middle" | "old";

export const AGE_BINS: AgeBin[] = ["18-25", "26-35", "36-45", "46+"];

export const mockModelPredictions: Record<ScenarioId, ModelPrediction[]> = {
  young: [
    {
      model_name: "dorsal",
      predicted_age: 22.4,
      confidence: 0.86,
      age_bins: { "18-25": 0.82, "26-35": 0.13, "36-45": 0.04, "46+": 0.01 },
    },
    {
      model_name: "face",
      predicted_age: 24.1,
      confidence: 0.79,
      age_bins: { "18-25": 0.74, "26-35": 0.19, "36-45": 0.05, "46+": 0.02 },
    },
    {
      model_name: "blood",
      predicted_age: 21.8,
      confidence: 0.81,
      age_bins: { "18-25": 0.88, "26-35": 0.09, "36-45": 0.02, "46+": 0.01 },
    },
  ],
  middle: [
    {
      model_name: "dorsal",
      predicted_age: 34.0,
      confidence: 0.70,
      age_bins: { "18-25": 0.10, "26-35": 0.70, "36-45": 0.15, "46+": 0.05 },
    },
    {
      model_name: "face",
      predicted_age: 36.4,
      confidence: 0.64,
      age_bins: { "18-25": 0.06, "26-35": 0.58, "36-45": 0.26, "46+": 0.10 },
    },
    {
      model_name: "blood",
      predicted_age: 33.2,
      confidence: 0.73,
      age_bins: { "18-25": 0.12, "26-35": 0.68, "36-45": 0.14, "46+": 0.06 },
    },
  ],
  old: [
    {
      model_name: "dorsal",
      predicted_age: 47.6,
      confidence: 0.62,
      age_bins: { "18-25": 0.02, "26-35": 0.06, "36-45": 0.24, "46+": 0.68 },
    },
    {
      model_name: "face",
      predicted_age: 51.3,
      confidence: 0.58,
      age_bins: { "18-25": 0.01, "26-35": 0.04, "36-45": 0.18, "46+": 0.77 },
    },
    {
      model_name: "blood",
      predicted_age: 46.9,
      confidence: 0.66,
      age_bins: { "18-25": 0.03, "26-35": 0.07, "36-45": 0.26, "46+": 0.64 },
    },
  ],
};

export function computeArm(predictions: ModelPrediction[]): ARMModelResult[] {
  const historicalReliabilityByModel: Record<string, number> = {
    dorsal: 0.82,
    face: 0.78,
    blood: 0.74,
  };

  const base = predictions.map((prediction) => {
    const historicalReliability = historicalReliabilityByModel[prediction.model_name] ?? 0.7;
    const evidenceStrength = Math.min(1, prediction.confidence + 0.08);
    const confidenceCap = 0.5 + 0.5 * prediction.confidence;
    const reliability = Math.min(historicalReliability, confidenceCap);
    return {
      model_name: prediction.model_name,
      historicalReliability,
      evidenceStrength,
      confidenceCap,
      reliability,
    };
  });

  const totalWeight = base.reduce((sum, item) => {
    const raw = item.reliability * item.evidenceStrength;
    return sum + Math.max(FUSION_MIN_MODEL_WEIGHT, raw);
  }, 0);

  return base.map((item) => {
    const rawWeight = item.reliability * item.evidenceStrength;
    const weight = Math.max(FUSION_MIN_MODEL_WEIGHT, rawWeight) / totalWeight;
    return {
      model_name: item.model_name,
      historical_reliability: item.historicalReliability,
      evidence_strength: item.evidenceStrength,
      confidence_cap: item.confidenceCap,
      reliability: item.reliability,
      weight,
    };
  });
}

export function fusePredictions(predictions: ModelPrediction[], armResults: ARMModelResult[]): FusionResult {
  const fusedAge = predictions.reduce((sum, prediction, index) => sum + armResults[index].weight * prediction.predicted_age, 0);
  const fusedConfidence = predictions.reduce((sum, prediction, index) => sum + armResults[index].weight * prediction.confidence, 0);
  const fusedAgeBins = AGE_BINS.reduce((acc, bin) => {
    acc[bin] = predictions.reduce((sum, prediction, index) => sum + armResults[index].weight * prediction.age_bins[bin], 0);
    const total = predictions.reduce((sum, _prediction, index) => sum + armResults[index].weight, 0);
    acc[bin] = total > 0 ? acc[bin] / total : 0;
    return acc;
  }, {} as Record<AgeBin, number>);

  return {
    fused_predicted_age: Number(fusedAge.toFixed(2)),
    fused_confidence: Number(fusedConfidence.toFixed(3)),
    fused_age_bins: fusedAgeBins,
    model_contributions: armResults.reduce((acc, armResult) => {
      acc[armResult.model_name] = Number((armResult.weight * 100).toFixed(1));
      return acc;
    }, {} as Record<string, number>),
  };
}
