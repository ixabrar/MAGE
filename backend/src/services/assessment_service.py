"""
Assessment service.

Orchestrates adapter selection and fusion execution for an assessment request.
"""

from typing import List, Dict, Optional

from schemas.fusion import ModelPrediction, FusionResult, AssessmentRequest
from adapters.face_adapter import run_face_adapter
from adapters.dorsal_adapter import run_dorsal_adapter
from adapters.blood_adapter import run_blood_adapter
from services.fusion_service import run_fusion


ADAPTER_MAP = {
    "face": run_face_adapter,
    "dorsal_hand": run_dorsal_adapter,
    "blood": run_blood_adapter,
}


def run_assessment(request: AssessmentRequest) -> Dict:
    """
    Execute an assessment end-to-end through mock adapters and real fusion.

    Args:
        request: validated assessment request.

    Returns:
        Dict containing:
            - predictions: List[ModelPrediction]
            - result: FusionResult
    """
    predictions: List[ModelPrediction] = []
    errors: Dict[str, str] = {}

    for modality in request.modalities:
        if modality == "blood":
            # Blood is handled outside the fusion layer.
            continue

        adapter = ADAPTER_MAP.get(modality)
        if adapter is None:
            errors[modality] = f"Unsupported modality: {modality}"
            continue

        input_ref = request.inputs.get(modality, {})

        try:
            prediction = adapter(input_ref)
            predictions.append(prediction)
        except Exception as exc:
            errors[modality] = str(exc)

    if errors:
        raise ValueError(f"Adapter errors: {errors}")

    if not predictions:
        raise ValueError("No model predictions were produced.")

    result: FusionResult = run_fusion(predictions)

    return {
        "predictions": predictions,
        "result": result,
    }
