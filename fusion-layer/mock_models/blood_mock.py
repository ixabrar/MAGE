"""
blood_mock.py
=============

Mock implementation of the future Blood age-estimation model.

Returns deterministic ModelPrediction objects for demo scenarios.
"""
from typing import Dict

from arm.schemas import ModelPrediction


_BLOOD_DISTRIBUTIONS: Dict[str, Dict[str, float]] = {
    "young": {
        "18-25": 0.5,
        "26-35": 0.3,
        "36-45": 0.15,
        "46+": 0.05,
    },
    "middle": {
        "18-25": 0.15,
        "26-35": 0.5,
        "36-45": 0.25,
        "46+": 0.1,
    },
    "old": {
        "18-25": 0.05,
        "26-35": 0.15,
        "36-45": 0.35,
        "46+": 0.45,
    },
}

_BLOOD_AGES = {
    "young": 25.0,
    "middle": 35.0,
    "old": 47.0,
}

_MODEL_CONFIDENCE = 0.60


def blood_mock(scenario: str) -> ModelPrediction:
    """
    Produce a deterministic ModelPrediction for the Blood model.

    Args:
        scenario: One of "young", "middle", "old".

    Returns:
        ModelPrediction with deterministic age_bins, predicted_age, and confidence.

    Raises:
        ValueError: If scenario is not recognized.
    """
    if scenario not in _BLOOD_DISTRIBUTIONS:
        raise ValueError(
            f"Invalid scenario '{scenario}'. "
            f"Choose from: {sorted(_BLOOD_DISTRIBUTIONS.keys())}"
        )

    return ModelPrediction(
        model_name="blood",
        predicted_age=_BLOOD_AGES[scenario],
        confidence=_MODEL_CONFIDENCE,
        age_bins=dict(_BLOOD_DISTRIBUTIONS[scenario]),
    )
