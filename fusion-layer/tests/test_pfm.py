"""
Tests for the Prediction Fusion Module (PFM).
"""
import pytest

from arm.schemas import ModelPrediction
from arm.arm import ARMModelResult
from arm.pfm import PredictionFusionModule, FusionResult


def make_pred(model_name, age_bins, confidence=0.8, predicted_age=30.0):
    return ModelPrediction(
        model_name=model_name,
        predicted_age=predicted_age,
        confidence=confidence,
        age_bins=age_bins,
    )


def make_arm_result(model_name, weight, reliability=0.8, evidence_strength=0.5):
    return ARMModelResult(
        model_name=model_name,
        reliability=reliability,
        evidence_strength=evidence_strength,
        weight=weight,
        age_bin_reliability={},
    )


class TestSingleModelIdentity:
    def test_age_bins_unchanged(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("dorsal", {"18-25": 0.5, "26-35": 0.3, "36-45": 0.2, "46+": 0.0})
        result = pfm.fuse([prediction], [make_arm_result("dorsal", 1.0)])
        assert result.fused_age_bins == {"18-25": 0.5, "26-35": 0.3, "36-45": 0.2, "46+": 0.0}

    def test_predicted_age_unchanged(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("dorsal", {"18-25": 1.0}, predicted_age=30.0)
        result = pfm.fuse([prediction], [make_arm_result("dorsal", 1.0)])
        assert result.fused_predicted_age == 30.0

    def test_confidence_unchanged(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("dorsal", {"18-25": 1.0}, confidence=0.7)
        result = pfm.fuse([prediction], [make_arm_result("dorsal", 1.0)])
        assert result.fused_confidence == 0.7

    def test_weight_is_one(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("dorsal", {"18-25": 1.0})
        result = pfm.fuse([prediction], [make_arm_result("dorsal", 1.0)])
        assert result.model_contributions == {"dorsal": 1.0}


class TestMultiModelFusion:
    def test_two_model_weighted_age(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}, predicted_age=30.0),
            make_pred("f", {"18-25": 1.0}, predicted_age=40.0),
        ]
        results = [make_arm_result("d", 0.3), make_arm_result("f", 0.7)]
        result = pfm.fuse(predictions, results)
        assert abs(result.fused_predicted_age - 37.0) < 1e-12

    def test_three_model_weighted_age(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}, predicted_age=30.0),
            make_pred("f", {"18-25": 1.0}, predicted_age=40.0),
            make_pred("b", {"18-25": 1.0}, predicted_age=50.0),
        ]
        results = [make_arm_result("d", 0.2), make_arm_result("f", 0.5), make_arm_result("b", 0.3)]
        result = pfm.fuse(predictions, results)
        assert abs(result.fused_predicted_age - 41.0) < 1e-12

    def test_known_hand_calculated(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 0.3, "26-35": 0.7}, confidence=0.3, predicted_age=30.0),
            make_pred("f", {"18-25": 0.8, "26-35": 0.2}, confidence=0.9, predicted_age=40.0),
        ]
        results = [make_arm_result("d", 0.2), make_arm_result("f", 0.8)]
        result = pfm.fuse(predictions, results)
        # 18-25: 0.2*0.3 + 0.8*0.8 = 0.70
        # 26-35: 0.2*0.7 + 0.8*0.2 = 0.30
        assert abs(result.fused_age_bins["18-25"] - 0.70) < 1e-12
        assert abs(result.fused_age_bins["26-35"] - 0.30) < 1e-12
        assert abs(result.fused_predicted_age - 38.0) < 1e-12
        assert abs(result.fused_confidence - 0.78) < 1e-12


class TestMissingAgeBins:
    def test_missing_bin_contributes_zero(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}),
            make_pred("f", {"26-35": 1.0}),
        ]
        results = [make_arm_result("d", 0.5), make_arm_result("f", 0.5)]
        result = pfm.fuse(predictions, results)
        assert "18-25" in result.fused_age_bins
        assert "26-35" in result.fused_age_bins
        assert abs(result.fused_age_bins["18-25"] - 0.5) < 1e-12
        assert abs(result.fused_age_bins["26-35"] - 0.5) < 1e-12


class TestProbabilitySum:
    def test_single_model_sum(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("d", {"18-25": 0.5, "26-35": 0.3, "36-45": 0.2, "46+": 0.0})
        result = pfm.fuse([prediction], [make_arm_result("d", 1.0)])
        assert abs(sum(result.fused_age_bins.values()) - 1.0) < 1e-12

    def test_two_model_sum(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 0.3, "26-35": 0.7}),
            make_pred("f", {"18-25": 0.8, "26-35": 0.2}),
        ]
        results = [make_arm_result("d", 0.2), make_arm_result("f", 0.8)]
        result = pfm.fuse(predictions, results)
        assert abs(sum(result.fused_age_bins.values()) - 1.0) < 1e-12

    def test_missing_bins_sum(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}),
            make_pred("f", {"26-35": 1.0}),
        ]
        results = [make_arm_result("d", 0.5), make_arm_result("f", 0.5)]
        result = pfm.fuse(predictions, results)
        assert abs(sum(result.fused_age_bins.values()) - 1.0) < 1e-12


class TestWeightedConfidence:
    def test_weighted_confidence(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}, confidence=0.3),
            make_pred("f", {"18-25": 1.0}, confidence=0.9),
        ]
        results = [make_arm_result("d", 0.4), make_arm_result("f", 0.6)]
        result = pfm.fuse(predictions, results)
        assert abs(result.fused_confidence - 0.78) < 1e-12

    def test_confidence_only_affects_fused_confidence(self):
        pfm = PredictionFusionModule()
        prediction = make_pred("d", {"18-25": 0.5, "26-35": 0.5}, confidence=0.3)
        result_low = pfm.fuse([prediction], [make_arm_result("d", 1.0)])
        prediction_high = make_pred("d", {"18-25": 0.5, "26-35": 0.5}, confidence=0.9)
        result_high = pfm.fuse([prediction_high], [make_arm_result("d", 1.0)])
        assert result_low.fused_age_bins == result_high.fused_age_bins
        assert result_low.fused_predicted_age == result_high.fused_predicted_age
        assert result_low.fused_confidence != result_high.fused_confidence


class TestValidationErrors:
    def test_empty_input(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="At least one prediction"):
            pfm.fuse([], [])

    def test_mismatched_lengths(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="must equal"):
            pfm.fuse([make_pred("d", {"18-25": 1.0})], [make_arm_result("d", 1.0), make_arm_result("f", 0.5)])

    def test_missing_arm_result(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="has no corresponding ARM result"):
            pfm.fuse([make_pred("d", {"18-25": 1.0}), make_pred("f", {"18-25": 1.0})], [make_arm_result("d", 1.0)])

    def test_duplicate_prediction_names(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="Duplicate model names in predictions"):
            pfm.fuse([make_pred("d", {"18-25": 1.0}), make_pred("d", {"18-25": 1.0})], [make_arm_result("d", 0.5), make_arm_result("d", 0.5)])

    def test_duplicate_arm_names(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="Duplicate model names in ARM results"):
            pfm.fuse([make_pred("d", {"18-25": 1.0}), make_pred("f", {"18-25": 1.0})], [make_arm_result("d", 0.5), make_arm_result("d", 0.5)])

    def test_negative_weight(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="is negative"):
            pfm.fuse([make_pred("d", {"18-25": 1.0})], [make_arm_result("d", -0.1)])

    def test_weights_not_summing_to_one(self):
        pfm = PredictionFusionModule()
        with pytest.raises(ValueError, match="not approximately 1.0"):
            pfm.fuse([make_pred("d", {"18-25": 1.0})], [make_arm_result("d", 0.5)])


class TestExtremeWeights:
    def test_extreme_weights(self):
        pfm = PredictionFusionModule()
        predictions = [
            make_pred("d", {"18-25": 1.0}),
            make_pred("f", {"18-25": 1.0}),
        ]
        results = [make_arm_result("d", 0.01), make_arm_result("f", 0.99)]
        result = pfm.fuse(predictions, results)
        assert abs(sum(result.fused_age_bins.values()) - 1.0) < 1e-12
        assert result.model_contributions == {"d": 0.01, "f": 0.99}
