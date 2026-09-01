"""
face_mock.py
============

Mock implementation of the future Face age-estimation model.

Returns deterministic ModelPrediction objects for demo scenarios.
"""
from typing import Dict

from arm.schemas import ModelPrediction


_FACE_DISTRIBUTIONS: Dict[str, Dict[str, float]] = {
    "young": {
        "18-25": 0.7,
        "26-35": 0.2,
        "36-45": 0.1,
        "46+": 0.0,
    },
    "middle": {
        "18-25": 0.1,
        "26-35": 0.65,
        "36-45": 0.2,
        "46+": 0.05,
    },
    "old": {
        "18-25": 0.0,
        "26-35": 0.05,
        "36-45": 0.25,
        "46+": 0.7,
    },
}

_FACE_AGES = {
    "young": 23.0,
    "middle": 33.0,
    "old": 50.0,
}

_MODEL_CONFIDENCE = 0.90


def face_mock(scenario: str) -> ModelPrediction:
    """
    Produce a deterministic ModelPrediction for the Face model.

    Args:
        scenario: One of "young", "middle", "old".

    Returns:
        ModelPrediction with deterministic age_bins, predicted_age, and confidence.

    Raises:
        ValueError: If scenario is not recognized.
    """
    if scenario not in _FACE_DISTRIBUTIONS:
        raise ValueError(
            f"Invalid scenario '{scenario}'. "
            f"Choose from: {sorted(_FACE_DISTRIBUTIONS.keys())}"
        )

    return ModelPrediction(
        model_name="face",
        predicted_age=_FACE_AGES[scenario],
        confidence=_MODEL_CONFIDENCE,
        age_bins=dict(_FACE_DISTRIBUTIONS[scenario]),
    )
