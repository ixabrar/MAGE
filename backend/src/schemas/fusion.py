from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional


class ModelPrediction(BaseModel):
    model_name: str = Field(..., description="Unique name of the model producing the prediction.")
    predicted_age: float = Field(..., ge=0, le=120, description="Predicted chronological age.")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence between 0 and 1.")
    age_bins: Dict[str, float] = Field(..., description="Probability distribution across age groups.")

    @field_validator("age_bins")
    @classmethod
    def validate_age_bins(cls, bins: Dict[str, float]) -> Dict[str, float]:
        if not bins:
            raise ValueError("age_bins cannot be empty")
        for age_bin, probability in bins.items():
            if probability < 0 or probability > 1:
                raise ValueError(f"Probability for {age_bin} must be between 0 and 1.")
        total = sum(bins.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(
                f"Age-bin probabilities must sum to approximately 1. Current sum: {total:.4f}"
            )
        return bins


class ARMModelResult(BaseModel):
    model_name: str
    reliability: float
    evidence_strength: float
    weight: float
    age_bin_reliability: Dict[str, float] = Field(default_factory=dict)


class FusionResult(BaseModel):
    fused_predicted_age: float
    fused_confidence: float
    fused_age_bins: Dict[str, float]
    model_contributions: Dict[str, float]


class AssessmentRequest(BaseModel):
    modalities: List[str]
    patient_id: Optional[str] = None
    organization_id: Optional[str] = None
    inputs: Dict[str, Dict[str, Optional[str]]] = Field(default_factory=dict)
    context: Dict[str, Optional[float]] = Field(default_factory=dict)


class AssessmentResponse(BaseModel):
    assessment_id: str
    status: str
    result: Optional[FusionResult] = None
    created_at: str
