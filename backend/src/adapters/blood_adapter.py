"""
Blood report model adapter.

Responsible for converting raw blood model output into the standardized
ModelPrediction contract expected by the real Fusion Layer.
"""

from typing import Dict, Optional

from schemas.fusion import ModelPrediction


def run_blood_adapter(input_ref: Dict[str, Optional[str]]) -> ModelPrediction:
    """
    Run the blood model adapter.

    For now this uses the deterministic mock blood model from the copied
    fusion-layer. Later this will be replaced with real blood model inference.

    Args:
        input_ref: modality input metadata, e.g.:
            {"type": "pdf_or_image", "file_url": "..."}

    Returns:
        ModelPrediction with model_name="blood"
    """
    if not input_ref.get("file_url"):
        raise ValueError("Blood input missing file reference")

    import sys
    from pathlib import Path

    fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
    sys.path.insert(0, str(fusion_layer_path))

    from mock_models.blood_mock import blood_mock

    prediction = blood_mock("middle")
    return prediction
