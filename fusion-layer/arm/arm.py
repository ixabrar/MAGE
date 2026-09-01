"""
arm.py
======

PURPOSE:
The main controller/orchestrator for the Adaptive Reliability Module.

This file will connect the individual ARM components:

    schemas
       ?
    error_profile
       ?
    reliability
       ?
    gating

The rest of the application should ideally interact with ARM
through this main interface instead of directly manipulating
every internal component.

CONCEPTUAL INPUT:

    Dorsal prediction
    Face prediction
    Blood prediction

CONCEPTUAL OUTPUT:

    model reliability
    dynamic model weights

Example:

    {
        "dorsal": 0.18,
        "face": 0.61,
        "blood": 0.21
    }

PFM will later consume these weights.

WHAT WE WILL BUILD HERE:
    1. Initialize ARM components
    2. Accept standardized model predictions
    3. Generate reliability information
    4. Generate dynamic weights
    5. Return a clean result to the rest of the system
"""
from typing import Dict, List

from .schemas import ModelPrediction
from .error_profile import ErrorProfileBuilder, ModelErrorProfile
from .reliability import ReliabilityCalculator
from .gating import GatingNetwork


class ARMModelResult:
    """
    Structured reliability and weight information for one model.

    Attributes:
        model_name: Name of the model.
        reliability: Evidence-aware reliability score [0, 1].
        evidence_strength: How much historical evidence exists [0, 1].
        weight: Normalized fusion weight assigned by the gating layer.
        age_bin_reliability: Per-age-bin reliability scores where available.
    """

    def __init__(
        self,
        model_name: str,
        reliability: float,
        evidence_strength: float,
        weight: float,
        age_bin_reliability: Dict[str, float],
    ):
        self.model_name = model_name
        self.reliability = reliability
        self.evidence_strength = evidence_strength
        self.weight = weight
        self.age_bin_reliability = age_bin_reliability

    def __repr__(self) -> str:
        return (
            f"ARMModelResult(model_name={self.model_name!r}, "
            f"reliability={self.reliability:.4f}, "
            f"evidence_strength={self.evidence_strength:.4f}, "
            f"weight={self.weight:.4f})"
        )


class ARM:
    """
    Adaptive Reliability Module orchestrator.

    Connects:
        ModelPrediction -> ErrorProfileBuilder -> ReliabilityCalculator
            -> GatingNetwork -> dynamic model weights

    The model's actual age is NOT known at fusion time, so ARM only
    uses:
        - current age-bin probabilities
        - historical age-bin performance
        - historical sample counts
        - model confidence
    """

    def __init__(self):
        self.profile_builder = ErrorProfileBuilder()
        self.reliability_calculator = ReliabilityCalculator()
        self.gating_network = GatingNetwork()
        self._profiles: Dict[str, ModelErrorProfile] = {}

    def add_history(
        self,
        model_name: str,
        actual_age: float,
        predicted_age: float,
        age_bin: str,
        confidence: float,
    ) -> None:
        """
        Record a historical validation prediction for a model.

        The actual age is only available from historical validation
        data, not from live inference.
        """
        self.profile_builder.record_prediction(
            model_name=model_name,
            actual_age=actual_age,
            predicted_age=predicted_age,
            age_bin=age_bin,
            confidence=confidence,
        )

    def build_profiles(self) -> Dict[str, ModelErrorProfile]:
        """
        Build error profiles for all models that have history.

        Must be called after adding history and before compute_weights.
        """
        self._profiles = {}
        for model_name in self.profile_builder.history:
            self._profiles[model_name] = self.profile_builder.build_profile(
                model_name
            )
        return self._profiles

    def compute_weights(
        self,
        predictions: List[ModelPrediction],
    ) -> List[ARMModelResult]:
        """
        Compute dynamic reliability and fusion weights for a list of
        ModelPrediction objects.

        Args:
            predictions: One or more standardized model predictions.

        Returns:
            List of ARMModelResult objects, one per prediction, in the
            same order as the input predictions.
        """
        if not predictions:
            return []

        # Ensure profiles are available.
        if not self._profiles:
            self.build_profiles()

        reliabilities: Dict[str, float] = {}
        evidence_strengths: Dict[str, float] = {}
        age_bin_reliabilities: Dict[str, Dict[str, float]] = {}

        for prediction in predictions:
            model_name = prediction.model_name
            profile = self._profiles.get(model_name)
            age_bin_probs = prediction.age_bins

            if profile is None:
                # No history for this model yet.
                reliabilities[model_name] = min(
                    0.5,
                    0.5 + 0.5 * prediction.confidence,
                )
                evidence_strengths[model_name] = 0.0
                age_bin_reliabilities[model_name] = {
                    age_bin: 0.5 for age_bin in age_bin_probs
                }
                continue

            # Compute probability-weighted evidence-aware reliability.
            weighted_reliability = 0.0
            total_probability = 0.0
            bin_reliabilities: Dict[str, float] = {}

            for age_bin, probability in age_bin_probs.items():
                if probability <= 0:
                    continue

                bin_reliability = (
                    self.reliability_calculator.calculate_evidence_aware_score(
                        profile, age_bin
                    )
                )
                bin_reliabilities[age_bin] = bin_reliability
                weighted_reliability += probability * bin_reliability
                total_probability += probability

            if total_probability > 0:
                reliabilities[model_name] = min(
                    weighted_reliability / total_probability,
                    0.5 + 0.5 * prediction.confidence,
                )
            else:
                reliabilities[model_name] = min(
                    0.5,
                    0.5 + 0.5 * prediction.confidence,
                )

            # Average evidence strength across requested bins.
            if bin_reliabilities:
                avg_evidence = sum(
                    self.reliability_calculator.calculate_evidence_score(
                        profile, age_bin
                    )
                    for age_bin in age_bin_probs
                    if age_bin_probs[age_bin] > 0
                ) / len(
                    [
                        age_bin
                        for age_bin in age_bin_probs
                        if age_bin_probs[age_bin] > 0
                    ]
                )
                evidence_strengths[model_name] = avg_evidence
            else:
                evidence_strengths[model_name] = 0.0

            age_bin_reliabilities[model_name] = bin_reliabilities

        # Delegate weight normalization to the gating layer.
        weights = self.gating_network.calculate_weights(reliabilities)

        results = []
        for prediction in predictions:
            model_name = prediction.model_name
            results.append(
                ARMModelResult(
                    model_name=model_name,
                    reliability=reliabilities[model_name],
                    evidence_strength=evidence_strengths[model_name],
                    weight=weights[model_name],
                    age_bin_reliability=age_bin_reliabilities.get(
                        model_name, {}
                    ),
                )
            )

        return results
