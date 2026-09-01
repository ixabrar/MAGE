"""
ARM - Adaptive Reliability Module

PURPOSE:
This package contains the intelligence responsible for deciding
how trustworthy each age-estimation model is.

ARM answers:
    "How much should we trust Dorsal, Face, Blood, etc.?"

ARM does NOT calculate the final fused age.
That responsibility belongs to the Probability Fusion Module (PFM).

PLANNED PIPELINE:

    Model Predictions
          ?
    Error History
          ?
    Error Profiles
          ?
    Reliability Scores
          ?
    Dynamic Gating
          ?
    Model Weights
          ?
    PFM

The files inside this package implement each stage separately.
"""

from .arm import ARM, ARMModelResult
from .pfm import PredictionFusionModule, FusionResult

__all__ = [
    "ARM",
    "ARMModelResult",
    "PredictionFusionModule",
    "FusionResult",
]
