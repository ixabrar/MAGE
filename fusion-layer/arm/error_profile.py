"""
error_profile.py
================

ERROR HISTORY + MODEL BEHAVIOUR ANALYSIS
----------------------------------------

This module is responsible for learning how each model behaves
from historical validation predictions.

CORE IDEA:

    Prediction + Ground Truth
              ↓
        Calculate Error
              ↓
        Store History
              ↓
        Analyze Behaviour
              ↓
        Build Error Profile

The error profile allows ARM to understand that a model may
perform differently across different age groups.

For example:

    Dorsal
        18-25 → high error
        26-35 → medium error
        36-45 → low error

This information will later be consumed by the reliability
module.

IMPORTANT:

This module does NOT decide the final model weight.

It only answers:

    "How has this model behaved historically?"

The reliability module will later answer:

    "Given that behaviour, how much should we trust it?"
"""

from dataclasses import dataclass, field
from typing import Dict, List


# ============================================================
# INDIVIDUAL ERROR RECORD
# ============================================================

@dataclass
class ErrorRecord:
    """
    Represents one historical prediction made by one model.

    Example:

        Actual age      = 21
        Predicted age   = 34

        absolute_error  = 13
        signed_error    = +13

    The age_bin tells us which age group the actual person
    belongs to.

    This distinction matters because model performance may
    change depending on the age group.
    """

    model_name: str
    actual_age: float
    predicted_age: float
    age_bin: str
    confidence: float

    @property
    def absolute_error(self) -> float:
        """
        Calculate how far the prediction was from the
        actual age.

        Example:

            predicted = 34
            actual = 21

            absolute error = 13
        """

        return abs(self.predicted_age - self.actual_age)

    @property
    def signed_error(self) -> float:
        """
        Calculate the direction of the prediction error.

        Positive  → model overestimated age
        Negative  → model underestimated age
        Zero      → exact prediction
        """

        return self.predicted_age - self.actual_age


# ============================================================
# MODEL ERROR PROFILE
# ============================================================

@dataclass
class ModelErrorProfile:
    """
    Stores the historical behaviour of one model.

    This is the higher-level representation of model weakness
    and strength.

    Example:

        Dorsal
            total_samples = 500
            overall_mae = 5.2

            age_bin_mae:
                18-25 → 7.8
                26-35 → 4.1
                36-45 → 3.2

    Later, the reliability system will use this profile.
    """

    model_name: str

    total_samples: int = 0

    overall_mae: float = 0.0

    overall_bias: float = 0.0

    age_bin_mae: Dict[str, float] = field(default_factory=dict)

    age_bin_bias: Dict[str, float] = field(default_factory=dict)

    age_bin_samples: Dict[str, int] = field(default_factory=dict)


# ============================================================
# ERROR PROFILE BUILDER
# ============================================================

class ErrorProfileBuilder:
    """
    Builds historical error profiles for multiple models.

    Responsibilities:

        1. Receive validation predictions
        2. Calculate prediction errors
        3. Store error records
        4. Calculate overall model performance
        5. Calculate age-specific performance

    It does NOT calculate dynamic model weights.
    """

    def __init__(self):
        """
        Create an empty history.

        Structure:

            {
                "dorsal": [...],
                "face": [...],
                "blood": [...]
            }
        """

        self.history: Dict[str, List[ErrorRecord]] = {}

    # --------------------------------------------------------
    # RECORD PREDICTION
    # --------------------------------------------------------

    def record_prediction(
        self,
        model_name: str,
        actual_age: float,
        predicted_age: float,
        age_bin: str,
        confidence: float,
    ) -> ErrorRecord:
        """
        Record one model prediction and its ground truth.

        This is the point where ARM learns from a historical
        example.

        Example:

            actual_age = 21
            predicted_age = 34

        The resulting ErrorRecord allows us to calculate:

            absolute_error = 13
            signed_error = +13
        """

        record = ErrorRecord(
            model_name=model_name,
            actual_age=actual_age,
            predicted_age=predicted_age,
            age_bin=age_bin,
            confidence=confidence,
        )

        if model_name not in self.history:
            self.history[model_name] = []

        self.history[model_name].append(record)

        return record

    # --------------------------------------------------------
    # BUILD PROFILE
    # --------------------------------------------------------

    def build_profile(self, model_name: str) -> ModelErrorProfile:
        """
        Convert the recorded history of one model into
        a summarized ModelErrorProfile.

        This transforms many individual predictions into
        useful statistics.
        """

        records = self.history.get(model_name, [])

        profile = ModelErrorProfile(
            model_name=model_name,
            total_samples=len(records),
        )

        if not records:
            return profile

        # ----------------------------------------------------
        # Overall performance
        # ----------------------------------------------------

        absolute_errors = [
            record.absolute_error
            for record in records
        ]

        signed_errors = [
            record.signed_error
            for record in records
        ]

        profile.overall_mae = (
            sum(absolute_errors) / len(absolute_errors)
        )

        profile.overall_bias = (
            sum(signed_errors) / len(signed_errors)
        )

        # ----------------------------------------------------
        # Age-specific performance
        # ----------------------------------------------------

        age_bin_errors: Dict[str, List[float]] = {}
        age_bin_signed_errors: Dict[str, List[float]] = {}

        for record in records:

            if record.age_bin not in age_bin_errors:
                age_bin_errors[record.age_bin] = []

            if record.age_bin not in age_bin_signed_errors:
                age_bin_signed_errors[record.age_bin] = []

            age_bin_errors[record.age_bin].append(
                record.absolute_error
            )

            age_bin_signed_errors[record.age_bin].append(
                record.signed_error
            )

        # Calculate statistics for each age bin.

        for age_bin, errors in age_bin_errors.items():

            profile.age_bin_mae[age_bin] = (
                sum(errors) / len(errors)
            )

            profile.age_bin_samples[age_bin] = len(errors)

        for age_bin, errors in age_bin_signed_errors.items():

            profile.age_bin_bias[age_bin] = (
                sum(errors) / len(errors)
            )

        return profile