"""
mock_models package
===================

PURPOSE:
Provide deterministic mock model implementations for the
ARM + PFM pipeline demo.

Each mock function returns a ModelPrediction for a given scenario.

Available mocks:
    - dorsal_mock(scenario) -> ModelPrediction
    - face_mock(scenario) -> ModelPrediction
    - blood_mock(scenario) -> ModelPrediction

Scenarios:
    - "young"
    - "middle"
    - "old"
"""

from .dorsal_mock import dorsal_mock
from .face_mock import face_mock
from .blood_mock import blood_mock

__all__ = [
    "dorsal_mock",
    "face_mock",
    "blood_mock",
]
