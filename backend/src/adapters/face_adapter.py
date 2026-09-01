"""
Face model adapter.

Responsible for converting raw face model output into the standardized
ModelPrediction contract expected by the real Fusion Layer.
"""

from typing import Dict, Optional

from schemas.fusion import ModelPrediction


def run_face_adapter(input_ref: Dict[str, Optional[str]]) -> ModelPrediction:
    """
    Run the face model adapter.

    For now this uses the deterministic mock face model from the copied
    fusion-layer. Later this will be replaced with real face model inference.

    Args:
        input_ref: modality input metadata, e.g.:
            {"type": "image", "file_url": "..."}

    Returns:
        ModelPrediction with model_name="face"
    """
    # Placeholder input validation
    if not input_ref.get("file_url"):
        raise ValueError("Face input missing file reference")

    # Import the real copied mock model from fusion-layer
    import sys
    from pathlib import Path

    fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
    sys.path.insert(0, str(fusion_layer_path))

    from mock_models.face_mock import face_mock

    prediction = face_mock("middle")
    return prediction
