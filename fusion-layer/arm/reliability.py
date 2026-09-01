"""
reliability.py
==============

PURPOSE:
Convert model performance information into RELIABILITY information.

CORE QUESTION:

    "How much should ARM trust this model?"

Inputs may eventually include:

    - historical error
    - age-specific error
    - model confidence
    - uncertainty
    - calibration quality
    - prediction stability

Example concept:

    Dorsal ? reliability 0.34
    Face   ? reliability 0.82
    Blood  ? reliability 0.57

These are NOT yet the final fusion weights.

They are evidence used to determine how reliable each model is.

WHAT WE WILL BUILD HERE:
    1. Convert error statistics into reliability scores
    2. Account for age-specific performance
    3. Combine confidence with historical performance
    4. Produce interpretable reliability information

IMPORTANT:
A model being "bad" overall does not necessarily mean it is
bad for every age group. Reliability should be conditional
where the available data supports it.
"""
from typing import Dict

from .error_profile import ModelErrorProfile

class ReliabilityCalculator:
    """
    Converts historical model error profiles into reliability scores.
    """

    def __init__(self):
        pass

    def calculate_accuracy_score(self,mae: float,) -> float:
        """
        Convert Mean Absolute Error (MAE) into a reliability score.

        The score is in the range [0, 1], where higher is better.

        Formula:

            reliability = 1 / (1 + mae)
        """
        if mae < 0:
            raise ValueError("MAE cannot be negative")

        return 1.0 / (1.0 + mae)

    def calculate_bias_score(self,bias: float,) -> float:
        """
    Convert model bias into a 0-1 reliability score.

    Bias tells us whether the model systematically
    overestimates or underestimates age.

    Smaller absolute bias = higher score.
    """

        return 1.0 / (1.0 + abs(bias))


    def calculate_age_bin_score(self, profile: ModelErrorProfile, age_bin: str,) -> float:
        """
    Calculate reliability based on the model's
    historical performance for a specific age bin.

    A model with lower MAE in that age bin
    receives a higher score.
    """
        mae = profile.age_bin_mae.get(age_bin)

        if mae is None:
            return 0.0

        return self.calculate_accuracy_score(mae)

    
    def calculate_evidence_score(
        self,
        profile: ModelErrorProfile,
        age_bin: str,
        ) -> float:
        """
            Calculate how much historical evidence exists
            for a specific age bin.

        More validation samples = stronger evidence.

        The score is between 0 and 1.
            """

        sample_count = profile.age_bin_samples.get(age_bin, 0)

        if sample_count < 0:
            raise ValueError("Sample count cannot be negative")

        return sample_count / (sample_count + 10)

    def calculate_probability_weighted_score(self,profile: ModelErrorProfile,age_bin_probabilities: Dict[str, float],
    ) -> float:
        """
        Calculate reliability across all age bins using
        the model's current age-bin probabilities.

        This allows ARM to estimate reliability without
        knowing the user's actual age.
        """

        total_score = 0.0
        total_probability = 0.0

        for age_bin, probability in age_bin_probabilities.items():

            if probability < 0:
                raise ValueError(
                    f"Age-bin probability cannot be negative: {probability}"
                )

            score = self.calculate_age_bin_score(
                profile,
                age_bin,
            )

            total_score += probability * score
            total_probability += probability

        if total_probability == 0:
            return 0.0

        return total_score / total_probability

    def calculate_evidence_aware_score(
        self,
        profile: ModelErrorProfile,
        age_bin: str,
    ) -> float:
        """
        Combine historical age-bin performance with evidence strength.

        Returns a reliability score between 0 and 1.

        When no evidence exists for an age bin, returns 0.5 (neutral)
        rather than treating the model as definitely bad.

        Formula:
            performance_score = 1 / (1 + MAE)
            evidence_score = samples / (samples + 10)
            evidence_aware_score = evidence_score * performance_score
                                   + (1 - evidence_score) * 0.5

        Interpretation:
            - excellent performance + strong evidence → high score
            - poor performance + strong evidence → low score
            - no evidence → 0.5 neutral score
        """
        mae = profile.age_bin_mae.get(age_bin)
        samples = profile.age_bin_samples.get(age_bin, 0)

        if samples == 0:
            return 0.5

        performance_score = 1.0 / (1.0 + mae)
        evidence_score = samples / (samples + 10.0)

        return evidence_score * performance_score + (1.0 - evidence_score) * 0.5
