"""
Dorsal hand model adapter — real ResNet18 + mock fallback.

Loads resnet18_consistent_age_best.pth from backend/src/models/
if available and torch is installed; otherwise falls back to deterministic
mock dorsal model so the service stays up in dev/CI without torch.
"""

from typing import Dict, Optional
from pathlib import Path
import sys
import os

# Ensure torch threading doesn't deadlock in async context
os.environ.setdefault("KMP_AFFINITY", "disabled")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from schemas.fusion import ModelPrediction

try:
    import torch

    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
except Exception:
    pass


# ---------------------------------------------------------------------------
# Lazy model singleton
# ---------------------------------------------------------------------------

_model = None
_model_meta = {}  # {num_classes, is_regression}
_device = "cpu"


def _try_load_real_model():
    global _model, _model_meta

    if _model is not None:
        return _model

    try:
        import torch
    except Exception as e:
        print(f"[dorsal_adapter] torch not available ({e}), using mock")
        return None

    model_root = Path(__file__).resolve().parents[1] / "models"

    model_file = model_root / "model_consistent_age.py"

    # The directory may exist because the original checkpoint was copied
    # there in sharded format. We should NOT try torch.load() on the directory.
    ckpt_dir = model_root / "resnet18_consistent_age_best"

    # This is the actual usable checkpoint file.
    ckpt_file = model_root / "resnet18_consistent_age_best.pth"

    # Optional fallback if the .zip file exists.
    ckpt_zip = model_root / "resnet18_consistent_age_best.pth.zip"

    # We need the model definition plus a real checkpoint.
    if not model_file.exists():
        print(
            f"[dorsal_adapter] model class missing under {model_root}, "
            "using mock"
        )
        return None

    if not (
        (ckpt_file.exists() and ckpt_file.is_file())
        or (ckpt_zip.exists() and ckpt_zip.is_file())
    ):
        print(
            f"[dorsal_adapter] real checkpoint missing under {model_root}, "
            "using mock"
        )
        return None

    # -----------------------------------------------------------------------
    # Import trained model class
    # -----------------------------------------------------------------------

    try:
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "model_consistent_age_local",
            str(model_file),
        )

        if spec is None or spec.loader is None:
            raise ImportError(
                f"Could not create import spec for {model_file}"
            )

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        ResNet18ConsistentAge = module.ResNet18ConsistentAge

    except Exception as e:
        print(
            f"[dorsal_adapter] failed to import real model class "
            f"({e}), using mock"
        )
        import traceback

        traceback.print_exc()
        return None

    # -----------------------------------------------------------------------
    # Load checkpoint
    # -----------------------------------------------------------------------

    try:
        load_path = None

        # IMPORTANT:
        # Prefer the actual .pth FILE.
        # Do not attempt torch.load() on the checkpoint directory.
        if ckpt_file.exists() and ckpt_file.is_file():
            load_path = ckpt_file

        elif ckpt_zip.exists() and ckpt_zip.is_file():
            load_path = ckpt_zip

        if load_path is None:
            raise FileNotFoundError(
                f"Real Dorsal checkpoint not found: {ckpt_file}"
            )

        print(
            f"[dorsal_adapter] loading checkpoint from {load_path}"
        )

        ckpt = torch.load(
            str(load_path),
            map_location="cpu",
            weights_only=False,
        )

        # The trained checkpoint contains:
        # epoch
        # model_state_dict
        # optimizer_state_dict
        # best_val_mae
        # config

        state_dict = ckpt.get(
            "model_state_dict",
            ckpt,
        )

        config = (
            ckpt.get("config")
            if isinstance(ckpt, dict)
            else None
        )

        # -------------------------------------------------------------------
        # Representative ages
        # -------------------------------------------------------------------
        #
        # The checkpoint stores representative_ages as a dictionary:
        #
        # {
        #     "18-25": ...,
        #     "26-35": ...,
        #     "36-45": ...,
        #     "46+": ...
        # }
        #
        # The model expects an ordered sequence of numeric values.
        # Use the model's AGE_BIN_LABELS ordering.
        # -------------------------------------------------------------------

        if (
            isinstance(config, dict)
            and "representative_ages" in config
        ):
            representative_ages_config = config["representative_ages"]

            if isinstance(representative_ages_config, dict):
                labels = getattr(
                    ResNet18ConsistentAge,
                    "AGE_BIN_LABELS",
                    ("18-25", "26-35", "36-45", "46+"),
                )

                rep = [
                    representative_ages_config[label]
                    for label in labels
                ]

            else:
                # Already a list/tuple/etc.
                rep = representative_ages_config

        else:
            raise ValueError(
                "Checkpoint config does not contain "
                "'representative_ages'"
            )

        print(
            f"[dorsal_adapter] representative ages: {rep}"
        )

        # -------------------------------------------------------------------
        # Build model and load trained weights
        # -------------------------------------------------------------------

        model = ResNet18ConsistentAge(
            representative_ages=rep
        ).to(_device).eval()

        model.load_state_dict(state_dict)

        _model = model

        _model_meta = {
            "ckpt_path": str(load_path),
            "config": config,
            "class_path": str(model_file),
        }

        print(
            f"[dorsal_adapter] loaded real model from {load_path}"
        )

        return _model

    except Exception as e:
        print(
            f"[dorsal_adapter] failed to load real model "
            f"({e}), using mock"
        )

        import traceback

        traceback.print_exc()

        return None


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------


def _preprocess_image(image_path_or_bytes):
    """
    Preprocess image to tensor 1x3x224x224 ImageNet normalized.
    """

    from PIL import Image
    import torchvision.transforms as T

    if isinstance(
        image_path_or_bytes,
        (bytes, bytearray),
    ):
        import io

        img = Image.open(
            io.BytesIO(image_path_or_bytes)
        ).convert("RGB")

    elif isinstance(image_path_or_bytes, str):
        img = Image.open(
            image_path_or_bytes
        ).convert("RGB")

    else:
        try:
            img = Image.open(
                image_path_or_bytes
            ).convert("RGB")

        except Exception:
            raise ValueError(
                "Unsupported image input type"
            )

    transform = T.Compose(
        [
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )

    return transform(img).unsqueeze(0)


# ---------------------------------------------------------------------------
# Real Dorsal inference
# ---------------------------------------------------------------------------


def predict_dorsal_from_image(
    image_input,
) -> ModelPrediction:
    """
    Core inference entry — accepts file path, bytes, or PIL buffer.

    Returns ModelPrediction with model_name="dorsal"
    for the ARM/PFM fusion contract.

    Falls back to mock if the real model is unavailable.
    """

    model = _try_load_real_model()

    if model is None:
        fusion_layer_path = (
            Path(__file__).resolve().parents[3]
            / "fusion-layer"
        )

        sys.path.insert(
            0,
            str(fusion_layer_path),
        )

        from mock_models.dorsal_mock import dorsal_mock

        return dorsal_mock("middle")

    try:
        import torch

        tensor = _preprocess_image(
            image_input
        ).to(_device)

        with torch.inference_mode():
            output = model.predict(tensor)

        predicted_age = float(
            output["predicted_age"][0, 0].cpu()
        )

        confidence = float(
            output["confidence"][0].cpu()
        )

        probs = (
            output["age_bin_probabilities"][0]
            .cpu()
            .tolist()
        )

        labels = getattr(
            model,
            "AGE_BIN_LABELS",
            ("18-25", "26-35", "36-45", "46+"),
        )

        age_bins = {
            str(label): float(prob)
            for label, prob in zip(labels, probs)
        }

        feature_dim = int(
            output["features"].shape[-1]
        )

        print(
            f"[dorsal_adapter] real inference "
            f"age={predicted_age:.1f} "
            f"confidence={confidence:.3f} "
            f"feature_dim={feature_dim}"
        )

        return ModelPrediction(
            model_name="dorsal",
            predicted_age=round(
                max(
                    0.0,
                    min(120.0, predicted_age),
                ),
                1,
            ),
            confidence=round(
                max(
                    0.0,
                    min(1.0, confidence),
                ),
                3,
            ),
            age_bins=age_bins,
        )

    except Exception as e:
        print(
            f"[dorsal_adapter] inference failed "
            f"({e}), fallback to mock"
        )

        import traceback

        traceback.print_exc()

        fusion_layer_path = (
            Path(__file__).resolve().parents[3]
            / "fusion-layer"
        )

        sys.path.insert(
            0,
            str(fusion_layer_path),
        )

        from mock_models.dorsal_mock import dorsal_mock

        return dorsal_mock("middle")


# ---------------------------------------------------------------------------
# Assessment service adapter entry
# ---------------------------------------------------------------------------


def run_dorsal_adapter(
    input_ref: Dict[str, Optional[str]],
) -> ModelPrediction:
    """
    Adapter entry used by assessment_service.py.

    Supports:
      - {"file_url": "..."} legacy mock path
      - {"file_path": "/tmp/..."} uploaded image path
      - {"image_bytes": b"..."} raw bytes

    If a real image is available it runs ResNet18;
    otherwise it uses the mock.
    """

    # New keys take precedence.

    if input_ref.get("file_path"):
        return predict_dorsal_from_image(
            input_ref["file_path"]
        )

    if input_ref.get("image_bytes"):
        return predict_dorsal_from_image(
            input_ref["image_bytes"]
        )

    file_url = input_ref.get("file_url")

    if not file_url:
        raise ValueError(
            "Dorsal hand input missing file reference"
        )

    # If file_url looks like a real path on disk,
    # try it directly.

    maybe_path = Path(file_url)

    if (
        maybe_path.exists()
        and maybe_path.is_file()
    ):
        return predict_dorsal_from_image(
            str(maybe_path)
        )

    # Also try backend uploads temp directory.

    alt = Path("/tmp") / Path(file_url).name

    if (
        alt.exists()
        and alt.is_file()
    ):
        return predict_dorsal_from_image(
            str(alt)
        )

    # Legacy fallback.

    print(
        f"[dorsal_adapter] no real image found "
        f"for file_url={file_url}, using mock"
    )

    fusion_layer_path = (
        Path(__file__).resolve().parents[3]
        / "fusion-layer"
    )

    sys.path.insert(
        0,
        str(fusion_layer_path),
    )

    from mock_models.dorsal_mock import dorsal_mock

    return dorsal_mock("middle")