"""
Dorsal hand model adapter — real ResNet18 + mock fallback.

Loads resnet18_consistent_age_best.pth (128M) from backend/src/models/
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
        import torch.nn as nn
        from torchvision import models
        from PIL import Image
    except Exception as e:
        # torch not installed in this env — fallback to mock
        print(f"[dorsal_adapter] torch not available ({e}), using mock")
        return None

    # Resolve model path — repo root or backend/src/models
    candidates = [
        Path(__file__).resolve().parents[2] / "models" / "resnet18_consistent_age_best.pth",  # backend/src/models
        Path(__file__).resolve().parents[2] / "resnet18_consistent_age_best.pth",  # backend/src/resnet18...
        Path(__file__).resolve().parents[3] / "resnet18_consistent_age_best.pth",  # repo root
        Path(__file__).resolve().parents[3] / "backend" / "src" / "models" / "resnet18_consistent_age_best.pth",
    ]
    ckpt_path = next((p for p in candidates if p.exists()), None)
    if ckpt_path is None:
        print(f"[dorsal_adapter] model file not found in {candidates}, using mock")
        return None

    try:
        ckpt = torch.load(str(ckpt_path), map_location="cpu")
        # Unwrap — this model uses 'model_state_dict' (see config)
        state = ckpt
        if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
            state = ckpt["model_state_dict"]
        elif isinstance(ckpt, dict) and "state_dict" in ckpt:
            state = ckpt["state_dict"]
        elif isinstance(ckpt, dict) and "model" in ckpt and isinstance(ckpt["model"], dict):
            state = ckpt["model"]
        config = ckpt.get("config") if isinstance(ckpt, dict) else None

        # Strip 'module.' prefix (DataParallel) and map custom heads
        clean_state = {}
        for k, v in state.items() if isinstance(state, dict) else []:
            nk = k[7:] if k.startswith("module.") else k
            # Map backbone.* -> * and age_distribution_head -> fc
            if nk.startswith("backbone."):
                nk = nk[len("backbone."):]
            if nk.startswith("age_distribution_head."):
                nk = nk.replace("age_distribution_head.", "fc.")
            clean_state[nk] = v
        # Remove non-parameter entries like representative_ages
        clean_state.pop("representative_ages", None)
        if clean_state:
            state = clean_state
            print(f"[dorsal_adapter] mapped keys sample {list(state.keys())[:5]} fc present {'fc.weight' in state} fc shape {state.get('fc.weight').shape if 'fc.weight' in state else 'n/a'}")

        # Infer num_classes from fc.weight shape
        num_classes = None
        for key in ["fc.weight", "classifier.weight", "head.weight"]:
            if key in state:
                num_classes = state[key].shape[0]
                break
        if num_classes is None:
            # Try any weight with shape [*,512]
            for k, v in state.items():
                try:
                    if hasattr(v, "shape") and len(v.shape) == 2 and v.shape[1] == 512:
                        num_classes = v.shape[0]
                        break
                except Exception:
                    continue
        if num_classes is None:
            num_classes = 1  # assume regression

        is_regression = (num_classes == 1)

        # Build ResNet18
        m = models.resnet18(weights=None)
        if is_regression:
            m.fc = nn.Linear(512, 1)
        else:
            m.fc = nn.Linear(512, num_classes)

        # Load with strict=False to allow minor mismatches
        try:
            m.load_state_dict(state, strict=False)
        except Exception as e:
            print(f"[dorsal_adapter] load_state_dict strict=False warning: {e}")
            # Try strict load for debugging
            missing, unexpected = m.load_state_dict(state, strict=False)
            print(f" missing {len(missing)} unexpected {len(unexpected)}")

        m.eval()
        m.to(_device)
        # keep config for correct age formula
        _model = m
        _model_meta = {"num_classes": num_classes, "is_regression": is_regression, "ckpt_path": str(ckpt_path), "config": config if 'config' in locals() else None}
        print(f"[dorsal_adapter] loaded {ckpt_path} num_classes={num_classes} regression={is_regression} config={_model_meta.get('config', {}).get('age_formula') if _model_meta.get('config') else 'n/a'}")
        return _model
    except Exception as e:
        print(f"[dorsal_adapter] failed to load real model ({e}), using mock")
        import traceback; traceback.print_exc()
        return None


def _age_to_bins(predicted_age: float):
    """Convert single age (regression) to 4-bin distribution for ModelPrediction contract."""
    bins = ["18-25", "26-35", "36-45", "46+"]
    # Centres must match training config (46+ = 70)
    centres = {"18-25": 21.5, "26-35": 30.5, "36-45": 40.5, "46+": 70.0}
    # Use softmax over negative distance
    import math
    scores = {}
    for b in bins:
        d = abs(predicted_age - centres[b])
        # sigma 8 gives smooth falloff
        scores[b] = math.exp(-0.5 * (d / 8) ** 2)
    total = sum(scores.values())
    probs = {k: round(v / total, 3) for k, v in scores.items()}
    # Renormalize to exactly 1.0
    s = sum(probs.values())
    if abs(s - 1.0) > 1e-6:
        # adjust largest
        mk = max(probs, key=lambda k: probs[k])
        probs[mk] = round(probs[mk] + (1.0 - s), 3)
    return probs

def _bins_from_logits(logits, bins=None):
    """Convert classification logits (4 or N) to age_bins dict."""
    import torch.nn.functional as F
    import torch
    if bins is None:
        bins = ["18-25", "26-35", "36-45", "46+"]
    probs = F.softmax(logits, dim=-1).detach().cpu().numpy()
    # logits may be [num_classes] or [[num_classes]]
    if len(probs.shape) == 2:
        probs = probs[0]
    # If num_classes != 4, map to 4 by grouping (e.g. 101 -> 4 bins)
    if len(probs) == 4:
        return {b: float(round(p, 3)) for b, p in zip(bins, probs)}
    elif len(probs) > 4:
        # Group: 18-25 (0-25), 26-35 (26-35), 36-45 (36-45), 46+ (46-100)
        # Assume logits correspond to ages 0..100
        import numpy as np
        ages = list(range(len(probs)))
        grouped = {b: 0.0 for b in bins}
        for age, p in zip(ages, probs):
            if age <= 25:
                grouped["18-25"] += float(p)
            elif age <= 35:
                grouped["26-35"] += float(p)
            elif age <= 45:
                grouped["36-45"] += float(p)
            else:
                grouped["46+"] += float(p)
        # round
        return {k: round(v, 3) for k, v in grouped.items()}
    else:
        # Fallback: uniform
        return {b: 0.25 for b in bins}

def _preprocess_image(image_path_or_bytes):
    """Preprocess image to tensor 1x3x224x224 ImageNet normalized."""
    from PIL import Image
    import torchvision.transforms as T

    if isinstance(image_path_or_bytes, Image.Image):
        img = image_path_or_bytes.convert("RGB")
    elif isinstance(image_path_or_bytes, (bytes, bytearray)):
        import io
        img = Image.open(io.BytesIO(image_path_or_bytes)).convert("RGB")
    elif isinstance(image_path_or_bytes, (str, Path)):
        img = Image.open(str(image_path_or_bytes)).convert("RGB")
    else:
        # Assume file-like
        try:
            img = Image.open(image_path_or_bytes).convert("RGB")
        except Exception:
            raise ValueError("Unsupported image input type")

    transform = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return transform(img).unsqueeze(0)  # 1x3x224x224


def predict_dorsal_from_image(image_input) -> ModelPrediction:
    """
    Core inference entry — accepts file path, bytes, or PIL buffer.
    Returns ModelPrediction with model_name="dorsal" (contract for ARM/PFM).
    Falls back to mock if real model unavailable.
    """
    model = _try_load_real_model()
    if model is None:
        # Mock fallback
        fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
        sys.path.insert(0, str(fusion_layer_path))
        from mock_models.dorsal_mock import dorsal_mock
        return dorsal_mock("middle")

    try:
        import torch
        tensor = _preprocess_image(image_input)
        with torch.no_grad():
            out = model(tensor.to(_device))
            # out shape: [1, num_classes] or [1,1]
            out = out.squeeze(0)
            meta = _model_meta
            if meta.get("is_regression"):
                # out is [1] or scalar
                pred_age = float(out.item() if out.numel() == 1 else out[0].item())
                # Clamp to plausible range
                pred_age = max(0.0, min(120.0, pred_age))
                bins = _age_to_bins(pred_age)
                conf = 0.85  # regression confidence heuristic
                return ModelPrediction(
                    model_name="dorsal",
                    predicted_age=round(pred_age, 1),
                    confidence=conf,
                    age_bins=bins,
                )
            else:
                # Classification — per config: 4 bins with representative ages 21.5,30.5,40.5,70.0 and confidence = max(prob)
                import torch.nn.functional as F
                logits = out.unsqueeze(0) if out.dim() == 1 else out
                probs = F.softmax(logits, dim=-1)
                num_classes = meta["num_classes"]
                cfg = meta.get("config") or {}
                rep = cfg.get("representative_ages") if cfg else None
                if num_classes == 4:
                    centres = [rep.get("18-25", 21.5) if rep else 21.5, rep.get("26-35", 30.5) if rep else 30.5, rep.get("36-45", 40.5) if rep else 40.5, rep.get("46+", 70.0) if rep else 70.0]
                    pred_age = float((probs[0].cpu().numpy() * __import__("numpy").array(centres)).sum())
                    bins = _bins_from_logits(logits[0])
                    conf = float(probs[0].max().item())
                else:
                    pred_age = float((probs[0].cpu().numpy() * __import__("numpy").arange(num_classes)).sum())
                    bins = _bins_from_logits(logits[0])
                    conf = float(probs[0].max().item())
                return ModelPrediction(
                    model_name="dorsal",
                    predicted_age=round(max(0.0, min(120.0, pred_age)), 1),
                    confidence=round(max(0.0, min(1.0, conf)), 3),
                    age_bins=bins,
                )
    except Exception as e:
        print(f"[dorsal_adapter] inference failed ({e}), fallback to mock")
        import traceback; traceback.print_exc()
        fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
        sys.path.insert(0, str(fusion_layer_path))
        from mock_models.dorsal_mock import dorsal_mock
        return dorsal_mock("middle")


def run_dorsal_adapter(input_ref: Dict[str, Optional[str]]) -> ModelPrediction:
    """
    Adapter entry used by assessment_service.py.

    Supports:
      - {"file_url": "..."} legacy mock path (filename only)
      - {"file_path": "/tmp/..."} new upload path
      - {"image_bytes": b"..."} raw bytes (not JSON-serializable, used internally)

    If a real image is available it runs ResNet18; otherwise mock.
    """
    # New keys take precedence
    if input_ref.get("file_path"):
        return predict_dorsal_from_image(input_ref["file_path"])
    if input_ref.get("image_bytes"):
        return predict_dorsal_from_image(input_ref["image_bytes"])  # type: ignore

    file_url = input_ref.get("file_url")
    if not file_url:
        raise ValueError("Dorsal hand input missing file reference")

    # If file_url looks like a real path on disk, try it
    maybe_path = Path(file_url)
    if maybe_path.exists() and maybe_path.is_file():
        return predict_dorsal_from_image(str(maybe_path))

    # Also try backend uploads temp dir
    alt = Path("/tmp") / Path(file_url).name
    if alt.exists():
        return predict_dorsal_from_image(str(alt))

    # Fallback: legacy mock (filename only, no bytes)
    # Keep behaviour for public assessment without real upload
    print(f"[dorsal_adapter] no real image found for file_url={file_url}, using mock")
    fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
    sys.path.insert(0, str(fusion_layer_path))
    from mock_models.dorsal_mock import dorsal_mock
    return dorsal_mock("middle")
