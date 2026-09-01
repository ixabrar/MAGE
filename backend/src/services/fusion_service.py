"""
Fusion service.

Responsible for importing the copied real Fusion Layer and executing:
    predictions -> ARM.compute_weights() -> ARMModelResult[]
    predictions + arm_results -> PFM.fuse() -> FusionResult
"""

from typing import List

import sys
from pathlib import Path

from schemas.fusion import ModelPrediction, ARMModelResult, FusionResult


def _ensure_fusion_layer_importable() -> Path:
    fusion_layer_path = Path(__file__).resolve().parents[2] / "fusion-layer"
    fusion_layer_str = str(fusion_layer_path)
    if fusion_layer_str not in sys.path:
        sys.path.insert(0, fusion_layer_str)
    return fusion_layer_path


def build_arm_with_history():
    """
    Build and return an ARM instance pre-populated with curated
    historical validation data, matching the behavior of demo_pipeline.py.
    """
    _ensure_fusion_layer_importable()
    from arm.arm import ARM

    arm = ARM()

    # Dorsal history
    for i in range(5):
        arm.add_history("dorsal", 20.0 + i, 30.0 + i, "18-25", 0.7)
    arm.add_history("dorsal", 26.0, 31.0, "26-35", 0.7)
    arm.add_history("dorsal", 27.0, 32.0, "26-35", 0.7)
    for i in range(4):
        arm.add_history("dorsal", 36.0 + i, 38.0 + i, "36-45", 0.9)
    arm.add_history("dorsal", 46.0, 47.0, "46+", 0.9)
    arm.add_history("dorsal", 47.0, 48.0, "46+", 0.9)
    arm.add_history("dorsal", 48.0, 49.0, "46+", 0.9)

    # Face history
    for i in range(5):
        arm.add_history("face", 20.0 + i, 22.0 + i, "18-25", 0.9)
    arm.add_history("face", 26.0, 30.0, "26-35", 0.8)
    arm.add_history("face", 27.0, 31.0, "26-35", 0.8)
    arm.add_history("face", 28.0, 32.0, "26-35", 0.8)
    arm.add_history("face", 29.0, 33.0, "26-35", 0.8)
    arm.add_history("face", 36.0, 41.0, "36-45", 0.8)
    arm.add_history("face", 37.0, 42.0, "36-45", 0.8)
    arm.add_history("face", 46.0, 54.0, "46+", 0.7)

    # Blood history
    for i in range(3):
        arm.add_history("blood", 20.0 + i, 26.0 + i, "18-25", 0.6)
    for i in range(3):
        arm.add_history("blood", 26.0 + i, 32.0 + i, "26-35", 0.6)
    for i in range(3):
        arm.add_history("blood", 36.0 + i, 42.0 + i, "36-45", 0.6)
    arm.add_history("blood", 46.0, 53.0, "46+", 0.6)
    arm.add_history("blood", 47.0, 54.0, "46+", 0.6)

    arm.build_profiles()
    return arm


_arm_instance = None


def get_arm_instance():
    global _arm_instance
    if _arm_instance is None:
        _arm_instance = build_arm_with_history()
    return _arm_instance


def run_fusion(predictions: List[ModelPrediction]) -> FusionResult:
    """
    Run the real ARM + PFM pipeline against the provided predictions.

    Args:
        predictions: standardized model predictions from adapters.

    Returns:
        FusionResult from the real PredictionFusionModule.
    """
    _ensure_fusion_layer_importable()
    from arm.arm import ARMModelResult
    from arm.pfm import PredictionFusionModule

    arm = get_arm_instance()
    arm_results: List[ARMModelResult] = arm.compute_weights(predictions)

    pfm = PredictionFusionModule()
    fusion_result = pfm.fuse(predictions, arm_results)

    return FusionResult(
        fused_predicted_age=fusion_result.fused_predicted_age,
        fused_confidence=fusion_result.fused_confidence,
        fused_age_bins=fusion_result.fused_age_bins,
        model_contributions=fusion_result.model_contributions,
    )
