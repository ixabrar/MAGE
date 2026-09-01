"""
pfm.py
=====

PURPOSE:
Prediction Fusion Module (PFM).

Combines standardized model predictions into a single biological age
estimate using the dynamic weights produced by the Adaptive Reliability
Module (ARM).

PFM does NOT compute reliability or weights itself. It receives:

    - List[ModelPrediction] from the individual models
    - List[ARMModelResult] from ARM

And produces:

    - fused age-bin probability distribution
    - fused predicted age
    - fused confidence (reporting metric only)
"""
from typing import Dict, List

from .schemas import ModelPrediction
from .arm import ARMModelResult


class FusionResult:
    """
    Structured output of the Prediction Fusion Module.

    Attributes:
        fused_age_bins: Normalized probability distribution across age bins.
        fused_predicted_age: Weighted average predicted age.
        fused_confidence: Weight-weighted average of input confidences.
        model_contributions: Per-model fusion weights used.
    """

    def __init__(
        self,
        fused_age_bins: Dict[str, float],
        fused_predicted_age: float,
        fused_confidence: float,
        model_contributions: Dict[str, float],
    ):
        self.fused_age_bins = fused_age_bins
        self.fused_predicted_age = fused_predicted_age
        self.fused_confidence = fused_confidence
        self.model_contributions = model_contributions

    def __repr__(self) -> str:
        return (
            f"FusionResult("
            f"fused_predicted_age={self.fused_predicted_age:.4f}, "
            f"fused_confidence={self.fused_confidence:.4f}, "
            f"fused_age_bins={self.fused_age_bins})"
        )


class PredictionFusionModule:
    """
    Fuses multiple model predictions into a single biological age estimate.

    Uses ARM-assigned weights as the sole fusion coefficients.

    The fusion formulas are:

        fused_age_bins[b] = Σ_i (w_i * p_i[b]) / Σ_b Σ_i (w_i * p_i[b])

        fused_predicted_age = Σ_i (w_i * age_i)

        fused_confidence = Σ_i (w_i * conf_i)

    where w_i, p_i[b], age_i, and conf_i come from the paired
    ARMModelResult and ModelPrediction objects.
    """

    @staticmethod
    def _validate_inputs(
        predictions: List[ModelPrediction],
        arm_results: List[ARMModelResult],
    ) -> Dict[str, ARMModelResult]:
        """
        Validate inputs and return a dict mapping model_name -> ARMModelResult.

        Raises ValueError on any validation failure.
        """
        # 1. At least one prediction.
        if not predictions:
            raise ValueError("At least one prediction is required.")

        # 2. Lengths must match.
        if len(predictions) != len(arm_results):
            raise ValueError(
                f"Number of predictions ({len(predictions)}) must equal "
                f"number of ARM results ({len(arm_results)})."
            )

        # 3. Model names must be unique within predictions.
        pred_names = [p.model_name for p in predictions]
        if len(set(pred_names)) != len(pred_names):
            raise ValueError("Duplicate model names in predictions.")

        # 4. Model names must be unique within ARM results.
        arm_names = [r.model_name for r in arm_results]
        if len(set(arm_names)) != len(arm_names):
            raise ValueError("Duplicate model names in ARM results.")

        # 5. Every prediction must have a corresponding ARM result.
        arm_map: Dict[str, ARMModelResult] = {}
        for result in arm_results:
            arm_map[result.model_name] = result

        for prediction in predictions:
            if prediction.model_name not in arm_map:
                raise ValueError(
                    f"Prediction model '{prediction.model_name}' has no "
                    f"corresponding ARM result."
                )

        # 6. ARM weights must be non-negative.
        for result in arm_results:
            if result.weight < 0:
                raise ValueError(
                    f"ARM weight for '{result.model_name}' is negative: "
                    f"{result.weight}"
                )

        # 7. ARM weights must sum to approximately 1.0.
        total_weight = sum(r.weight for r in arm_results)
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError(
                f"ARM weights sum to {total_weight:.6f}, not approximately 1.0."
            )

        # 8. ARM weights must not contain NaN or infinity.
        for result in arm_results:
            w = result.weight
            if w != w or w == float("inf") or w == float("-inf"):
                raise ValueError(
                    f"ARM weight for '{result.model_name}' is not a finite number: {w}"
                )

        return arm_map

    def fuse(
        self,
        predictions: List[ModelPrediction],
        arm_results: List[ARMModelResult],
    ) -> FusionResult:
        """
        Fuse predictions into a single biological age estimate.

        Args:
            predictions: Standardized model predictions.
            arm_results: Corresponding ARM reliability/weight results.

        Returns:
            FusionResult with fused distribution, predicted age, and confidence.
        """
        arm_map = self._validate_inputs(predictions, arm_results)

        # Align data by prediction order.
        weights = []
        age_bins_list = []
        predicted_ages = []
        confidences = []

        for prediction in predictions:
            result = arm_map[prediction.model_name]
            weights.append(result.weight)
            age_bins_list.append(prediction.age_bins)
            predicted_ages.append(prediction.predicted_age)
            confidences.append(prediction.confidence)

        # Build union of all age-bin names.
        all_bins = set()
        for bins in age_bins_list:
            all_bins.update(bins.keys())

        # Weighted probability mixture.
        raw_fused: Dict[str, float] = {}
        for age_bin in all_bins:
            raw = 0.0
            for bins, weight in zip(age_bins_list, weights):
                raw += weight * bins.get(age_bin, 0.0)
            raw_fused[age_bin] = raw

        # Floating-point safety normalization.
        total_prob = sum(raw_fused.values())
        if total_prob <= 0.0:
            equal_prob = 1.0 / len(all_bins) if all_bins else 0.0
            fused_age_bins = {bin_name: equal_prob for bin_name in all_bins}
        else:
            fused_age_bins = {
                bin_name: prob / total_prob
                for bin_name, prob in raw_fused.items()
            }

        # Weighted predicted age.
        fused_predicted_age = sum(
            weight * age for weight, age in zip(weights, predicted_ages)
        )

        # Fused confidence: reporting metric only.
        fused_confidence = sum(
            weight * conf for weight, conf in zip(weights, confidences)
        )

        # Model contributions in prediction order.
        model_contributions = {
            prediction.model_name: weight
            for prediction, weight in zip(predictions, weights)
        }

        return FusionResult(
            fused_age_bins=fused_age_bins,
            fused_predicted_age=fused_predicted_age,
            fused_confidence=fused_confidence,
            model_contributions=model_contributions,
        )
