"""
dorsal_mock.py
==============

Mock implementation of the future Dorsal Hand age-estimation model.

Returns deterministic ModelPrediction objects for demo scenarios.
"""
from typing import Dict

from arm.schemas import ModelPrediction


# Fixed per-scenario age-bin probability distributions.
_DORSAL_DISTRIBUTIONS: Dict[str, Dict[str, float]] = {
    "young": {
        "18-25": 0.8,
        "26-35": 0.15,
        "36-45": 0.05,
        "46+": 0.0,
    },
    "middle": {
        "18-25": 0.1,
        "26-35": 0.7,
        "36-45": 0.15,
        "46+": 0.05,
    },
    "old": {
        "18-25": 0.0,
        "26-35": 0.1,
        "36-45": 0.3,
        "46+": 0.6,
    },
}

# Fixed per-scenario predicted ages.
_DORSAL_AGES = {
    "young": 24.0,
    "middle": 34.0,
    "old": 48.0,
}

_MODEL_CONFIDENCE = 0.70


def dorsal_mock(scenario: str) -> ModelPrediction:
    """
    Produce a deterministic ModelPrediction for the Dorsal model.

    Args:
        scenario: One of "young", "middle", "old".

    Returns:
        ModelPrediction with deterministic age_bins, predicted_age, and confidence.

    Raises:
        ValueError: If scenario is not recognized.
    """
    if scenario not in _DORSAL_DISTRIBUTIONS:
        raise ValueError(
            f"Invalid scenario '{scenario}'. "
            f"Choose from: {sorted(_DORSAL_DISTRIBUTIONS.keys())}"
        )

    return ModelPrediction(
        model_name="dorsal",
        predicted_age=_DORSAL_AGES[scenario],
        confidence=_MODEL_CONFIDENCE,
        age_bins=dict(_DORSAL_DISTRIBUTIONS[scenario]),
    )
