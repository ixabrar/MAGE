"""
Dorsal hand model adapter.

Responsible for converting raw dorsal hand model output into the standardized
ModelPrediction contract expected by the real Fusion Layer.
"""

from typing import Dict, Optional

from schemas.fusion import ModelPrediction


def run_dorsal_adapter(input_ref: Dict[str, Optional[str]]) -> ModelPrediction:
    """
    Run the dorsal hand model adapter.

    For now this uses the deterministic mock dorsal model from the copied
    fusion-layer. Later this will be replaced with real dorsal model inference.

    Args:
        input_ref: modality input metadata, e.g.:
            {"type": "image", "file_url": "..."}

    Returns:
        ModelPrediction with model_name="dorsal"
    """
    if not input_ref.get("file_url"):
        raise ValueError("Dorsal hand input missing file reference")

    import sys
    from pathlib import Path

    fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
    sys.path.insert(0, str(fusion_layer_path))

    from mock_models.dorsal_mock import dorsal_mock

    prediction = dorsal_mock("middle")
    return prediction
