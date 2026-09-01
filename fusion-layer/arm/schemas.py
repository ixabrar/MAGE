"""
schemas.py
==========

This file defines the standardized data contract for the
Adaptive Reliability Module (ARM).

Every age-estimation model — Dorsal, Face, Blood, or any
future model — must eventually convert its output into
the structures defined here.

The most important structure is ModelPrediction.

Conceptually:

    Model
      ↓
    ModelPrediction
      ↓
    ARMcd fusion
python

ModelPrediction contains:

    1. model_name
    2. predicted_age
    3. confidence
    4. age_bins

Why do we need this?

Because the individual models can be completely different
internally. ARM should not care how they were trained.

ARM only needs a standardized prediction.

This creates the plug-and-play boundary between the
individual models and the Fusion Layer.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict


class ModelPrediction(BaseModel):
    """
    Standardized output produced by an individual age model.

    Example:

        ModelPrediction(
            model_name="dorsal",
            predicted_age=34.0,
            confidence=0.72,
            age_bins={
                "18-25": 0.10,
                "26-35": 0.72,
                "36-45": 0.15,
                "46+": 0.03
            }
        )

    ARM will consume this structure regardless of which
    model produced it.
    """

    model_name: str = Field(
        ...,
        description="Unique name of the model producing the prediction."
    )

    predicted_age: float = Field(
        ...,
        ge=0,
        le=120,
        description="Predicted chronological age."
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Model confidence between 0 and 1."
    )

    age_bins: Dict[str, float] = Field(
        ...,
        description="Probability distribution across age groups."
    )

    @field_validator("age_bins")
    @classmethod
    def validate_age_bins(cls, bins: Dict[str, float]):
        """
        Validate the age-bin probability distribution.

        Each probability must be between 0 and 1 and the
        complete distribution should approximately sum to 1.
        """

        if not bins:
            raise ValueError("age_bins cannot be empty")

        for age_bin, probability in bins.items():

            if probability < 0 or probability > 1:
                raise ValueError(
                    f"Probability for {age_bin} must be between 0 and 1."
                )

        total = sum(bins.values())

        if abs(total - 1.0) > 0.01:
            raise ValueError(
                f"Age-bin probabilities must sum to approximately 1. "
                f"Current sum: {total:.4f}"
            )

        return bins