"""
demo_pipeline.py
================

End-to-end demonstration of the ARM + PFM pipeline.

Shows how Mock Dorsal + Mock Face + Mock Blood
    -> ModelPrediction objects
    -> ARM.compute_weights()
    -> ARMModelResult weights
    -> PFM.fuse()
    -> final fused biological-age result.

Run:
    python demo_pipeline.py
"""
from typing import List

from arm.arm import ARM, ARMModelResult
from arm.pfm import PredictionFusionModule, FusionResult
from mock_models.dorsal_mock import dorsal_mock
from mock_models.face_mock import face_mock
from mock_models.blood_mock import blood_mock
from arm.schemas import ModelPrediction


# ============================================================
# ARM HISTORY SETUP
# ============================================================
# Curated histories that make each model's age-bin strengths/weaknesses visible.
# All actual/predicted pairs are chosen to produce exact target MAEs.

def build_arm() -> ARM:
    """
    Create and populate an ARM instance with historical validation data
    for all three models.
    """
    arm = ARM()

    # --------------------------------------------------------
    # Dorsal history
    # --------------------------------------------------------
    # 18-25: 5 samples, MAE 10 (poor on youth)
    for i in range(5):
        arm.add_history("dorsal", 20.0 + i, 30.0 + i, "18-25", 0.7)
    # 26-35: 2 samples, MAE 5
    arm.add_history("dorsal", 26.0, 31.0, "26-35", 0.7)
    arm.add_history("dorsal", 27.0, 32.0, "26-35", 0.7)
    # 36-45: 4 samples, MAE 2 (good on middle age)
    for i in range(4):
        arm.add_history("dorsal", 36.0 + i, 38.0 + i, "36-45", 0.9)
    # 46+: 3 samples, MAE 1 (good on older)
    arm.add_history("dorsal", 46.0, 47.0, "46+", 0.9)
    arm.add_history("dorsal", 47.0, 48.0, "46+", 0.9)
    arm.add_history("dorsal", 48.0, 49.0, "46+", 0.9)

    # --------------------------------------------------------
    # Face history
    # --------------------------------------------------------
    # 18-25: 5 samples, MAE 2 (strong on youth)
    for i in range(5):
        arm.add_history("face", 20.0 + i, 22.0 + i, "18-25", 0.9)
    # 26-35: 4 samples, MAE 4
    arm.add_history("face", 26.0, 30.0, "26-35", 0.8)
    arm.add_history("face", 27.0, 31.0, "26-35", 0.8)
    arm.add_history("face", 28.0, 32.0, "26-35", 0.8)
    arm.add_history("face", 29.0, 33.0, "26-35", 0.8)
    # 36-45: 2 samples, MAE 5
    arm.add_history("face", 36.0, 41.0, "36-45", 0.8)
    arm.add_history("face", 37.0, 42.0, "36-45", 0.8)
    # 46+: 1 sample, MAE 8 (thin evidence on old)
    arm.add_history("face", 46.0, 54.0, "46+", 0.7)

    # --------------------------------------------------------
    # Blood history
    # --------------------------------------------------------
    # 18-25: 3 samples, MAE 6
    for i in range(3):
        arm.add_history("blood", 20.0 + i, 26.0 + i, "18-25", 0.6)
    # 26-35: 3 samples, MAE 6
    for i in range(3):
        arm.add_history("blood", 26.0 + i, 32.0 + i, "26-35", 0.6)
    # 36-45: 3 samples, MAE 6
    for i in range(3):
        arm.add_history("blood", 36.0 + i, 42.0 + i, "36-45", 0.6)
    # 46+: 2 samples, MAE 7
    arm.add_history("blood", 46.0, 53.0, "46+", 0.6)
    arm.add_history("blood", 47.0, 54.0, "46+", 0.6)

    arm.build_profiles()
    return arm


# ============================================================
# PIPELINE
# ============================================================

def run_scenario(
    arm: ARM,
    pfm: PredictionFusionModule,
    scenario: str,
) -> List[ARMModelResult]:
    """
    Run one demo scenario through the full ARM -> PFM pipeline.

    Args:
        arm: Pre-populated ARM instance.
        pfm: PredictionFusionModule instance.
        scenario: One of "young", "middle", "old".

    Returns:
        List of ARMModelResult objects from ARM.
    """
    predictions: List[ModelPrediction] = [
        dorsal_mock(scenario),
        face_mock(scenario),
        blood_mock(scenario),
    ]

    arm_results = arm.compute_weights(predictions)
    fusion_result = pfm.fuse(predictions, arm_results)

    print(f"=== Mock Pipeline: {scenario} scenario ===")
    print()
    print("Predictions:")
    for p in predictions:
        print(f"  {p.model_name}: age={p.predicted_age:.1f}, conf={p.confidence:.2f}, bins={p.age_bins}")
    print()
    print("ARM Results:")
    for r in arm_results:
        print(
            f"  {r.model_name}: reliability={r.reliability:.4f}, "
            f"evidence={r.evidence_strength:.4f}, weight={r.weight:.4f}"
        )
    print(f"  Weight SUM: {sum(r.weight for r in arm_results):.6f}")
    print()
    print("PFM Result:")
    print(f"  Fused age bins: {fusion_result.fused_age_bins}")
    print(f"  Fused predicted age: {fusion_result.fused_predicted_age:.4f}")
    print(f"  Fused confidence: {fusion_result.fused_confidence:.4f}")
    print(f"  Model contributions: {fusion_result.model_contributions}")
    print(f"  Probability SUM: {sum(fusion_result.fused_age_bins.values()):.6f}")
    print()

    return arm_results


def main() -> None:
    arm = build_arm()
    pfm = PredictionFusionModule()

    scenarios = ["young", "middle", "old"]
    all_results = {}

    for scenario in scenarios:
        all_results[scenario] = run_scenario(arm, pfm, scenario)

    # --------------------------------------------------------
    # Summary: show ARM adaptivity across scenarios
    # --------------------------------------------------------
    print("=== ARM Adaptivity Summary ===")
    print()
    for scenario in scenarios:
        weights = {r.model_name: r.weight for r in all_results[scenario]}
        print(f"  {scenario}: {weights}")
    print()

    # --------------------------------------------------------
    # Determinism check: run young twice
    # --------------------------------------------------------
    print("=== Determinism Check (young scenario run twice) ===")
    run1 = run_scenario(arm, pfm, "young")
    run2 = run_scenario(arm, pfm, "young")

    same = all(
        abs(r1.reliability - r2.reliability) < 1e-12
        and abs(r1.weight - r2.weight) < 1e-12
        and abs(r1.evidence_strength - r2.evidence_strength) < 1e-12
        for r1, r2 in zip(run1, run2)
    )
    print(f"  Identical output: {same}")
    print()

    # --------------------------------------------------------
    # Single-model PFM identity check
    # --------------------------------------------------------
    print("=== Single-Model PFM Identity ===")
    single_pred = dorsal_mock("middle")
    single_arm = [ARMModelResult(
        model_name="dorsal",
        reliability=0.8,
        evidence_strength=0.5,
        weight=1.0,
        age_bin_reliability={},
    )]
    single_result = pfm.fuse([single_pred], single_arm)
    print(f"  Input bins: {single_pred.age_bins}")
    print(f"  Fused bins: {single_result.fused_age_bins}")
    print(f"  Input age: {single_pred.predicted_age}")
    print(f"  Fused age: {single_result.fused_predicted_age}")
    print(f"  Input conf: {single_pred.confidence}")
    print(f"  Fused conf: {single_result.fused_confidence}")
    print(f"  Identity holds: {single_result.fused_age_bins == single_pred.age_bins and single_result.fused_predicted_age == single_pred.predicted_age and single_result.fused_confidence == single_pred.confidence}")
    print()
    print("Done.")


if __name__ == "__main__":
    main()
