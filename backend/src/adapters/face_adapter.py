"""
Face model adapter — Real Phase 3 Hierarchical Distributional Age Model + Mock Fallback.

Loads best_hierarchical_dist.pt (EfficientNet-B0 + 6 Distributional MoE heads over ages 0-100)
from backend/src/models/ if available and timm/torch are installed; otherwise falls back to
deterministic mock face model so the service stays up in lightweight environments.
"""

from typing import Dict, Optional, Union
from pathlib import Path
import sys
import os
import io

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
# 1. Model Architecture Definition
# ---------------------------------------------------------------------------
def _build_model_class():
    import torch
    import torch.nn as nn
    import timm

    class DistributionalHierarchicalAgeModel(nn.Module):
        """
        Hierarchical Distributional Gated Age Model.
        Fuses 6 local distributional expert heads over ages 0-100 via soft gating.
        """
        def __init__(self, model_name: str = 'efficientnet_b0', pretrained: bool = False):
            super().__init__()
            self.model_name = model_name
            self.backbone = timm.create_model(model_name, pretrained=pretrained)
            
            # Remove classifier head to expose feature dimension
            if hasattr(self.backbone, 'classifier'):
                in_features = self.backbone.classifier.in_features
                self.backbone.classifier = nn.Identity()
            elif hasattr(self.backbone, 'fc'):
                in_features = self.backbone.fc.in_features
                self.backbone.fc = nn.Identity()
            elif hasattr(self.backbone, 'head'):
                if hasattr(self.backbone.head, 'fc'):
                    in_features = self.backbone.head.fc.in_features
                    self.backbone.head.fc = nn.Identity()
                else:
                    in_features = self.backbone.head.in_features
                    self.backbone.head = nn.Identity()
            else:
                raise AttributeError(f"Could not identify classifier head for backbone: {model_name}")
                
            # Coarse Gating Head (6 developmental stages)
            self.gate_fc = nn.Linear(in_features, 6)
            
            # 6 Distributional Expert Heads
            self.experts = nn.ModuleList([
                nn.Linear(in_features, 13),  # Expert 0: Child (ages 0-12, 13 bins)
                nn.Linear(in_features, 7),   # Expert 1: Teen (ages 13-19, 7 bins)
                nn.Linear(in_features, 16),  # Expert 2: Young Adult (ages 20-35, 16 bins)
                nn.Linear(in_features, 15),  # Expert 3: Middle Age (ages 36-50, 15 bins)
                nn.Linear(in_features, 15),  # Expert 4: Older Adult (ages 51-65, 15 bins)
                nn.Linear(in_features, 35)   # Expert 5: Elderly (ages 66-100, 35 bins)
            ])
            
            # Age index slice mapping for global 101-bin distribution [0, 100]
            self.slices = [
                (0, 13),    # 0-12
                (13, 20),   # 13-19
                (20, 36),   # 20-35
                (36, 51),   # 36-50
                (51, 66),   # 51-65
                (66, 101)   # 66-100
            ]
            
        def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
            features = self.backbone(x)
            
            # Gating probabilities
            gate_logits = self.gate_fc(features)
            gate_probs = torch.softmax(gate_logits, dim=-1)
            
            batch_size = features.size(0)
            device = features.device
            global_probs = torch.zeros(batch_size, 101, device=device)
            classes_global = torch.arange(101, dtype=torch.float32, device=device)
            
            for idx, (start, end) in enumerate(self.slices):
                local_logits = self.experts[idx](features)
                local_probs = torch.softmax(local_logits, dim=-1)
                global_probs[:, start:end] = gate_probs[:, idx:idx+1] * local_probs
                
            # Continuous expected age via probability expectation
            fused_age = torch.sum(global_probs * classes_global.unsqueeze(0), dim=-1)
            
            return {
                "age": fused_age,
                "probabilities": global_probs,
                "gate_probabilities": gate_probs
            }

    return DistributionalHierarchicalAgeModel


# ---------------------------------------------------------------------------
# 2. Singleton Model Loader
# ---------------------------------------------------------------------------
_face_model = None
_face_device = "cpu"


def _try_load_real_face_model():
    global _face_model, _face_device
    if _face_model is not None:
        return _face_model

    try:
        import torch
        import timm
        from PIL import Image
    except Exception as e:
        print(f"[face_adapter] torch/timm not available ({e}), using mock")
        return None

    # Resolve model path
    candidates = [
        Path(__file__).resolve().parents[2] / "models" / "best_hierarchical_dist.pt",
        Path(__file__).resolve().parents[3] / "models" / "best_hierarchical_dist.pt",
        Path(__file__).resolve().parents[3] / "backend" / "src" / "models" / "best_hierarchical_dist.pt",
        Path(r"d:\Projects\Cognizant\outputs\checkpoints\best_hierarchical_dist.pt"),
    ]
    ckpt_path = next((p for p in candidates if p.exists()), None)
    if ckpt_path is None:
        print(f"[face_adapter] checkpoint not found in {candidates}, using mock")
        return None

    try:
        ModelClass = _build_model_class()
        _face_device = "cuda" if torch.cuda.is_available() else "cpu"
        model = ModelClass(model_name="efficientnet_b0", pretrained=False)
        
        checkpoint = torch.load(str(ckpt_path), map_location=_face_device)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint
            
        model.load_state_dict(state_dict)
        model.to(_face_device)
        model.eval()
        _face_model = model
        print(f"[face_adapter] successfully loaded real face model from {ckpt_path} on {_face_device}")
        return _face_model
    except Exception as e:
        print(f"[face_adapter] failed to load real face model ({e}), using mock")
        import traceback; traceback.print_exc()
        return None


# ---------------------------------------------------------------------------
# 3. Preprocessing & Inference
# ---------------------------------------------------------------------------
def _preprocess_face_image(image_input):
    """Preprocess image to tensor 1x3x224x224 ImageNet normalized."""
    from PIL import Image
    from torchvision import transforms

    if isinstance(image_input, (bytes, bytearray)):
        img = Image.open(io.BytesIO(image_input))
    elif isinstance(image_input, (str, Path)):
        img = Image.open(str(image_input))
    elif hasattr(image_input, "convert"):
        img = image_input
    else:
        try:
            img = Image.open(image_input)
        except Exception:
            raise ValueError("Unsupported face image input type")

    img = img.convert("RGB")
    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    return eval_transforms(img).unsqueeze(0)


def predict_face_from_image(image_input) -> ModelPrediction:
    """
    Run real EfficientNet-B0 Hierarchical MoE inference on facial image.
    Returns ModelPrediction with model_name="face" matching ARM/PFM contract.
    """
    model = _try_load_real_face_model()
    if model is None:
        fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
        if str(fusion_layer_path) not in sys.path:
            sys.path.insert(0, str(fusion_layer_path))
        from mock_models.face_mock import face_mock
        return face_mock("middle")

    try:
        import torch
        import numpy as np

        input_tensor = _preprocess_face_image(image_input).to(_face_device)
        with torch.no_grad():
            outputs = model(input_tensor)

        predicted_age = float(outputs["age"].item())
        probabilities = outputs["probabilities"][0].cpu().numpy()  # 101 bins (ages 0 to 100)

        # Standard 4-bin aggregation expected by ARM/PFM
        p_18_25 = float(np.sum(probabilities[18:26]))
        p_26_35 = float(np.sum(probabilities[26:36]))
        p_36_45 = float(np.sum(probabilities[36:46]))
        p_46_plus = float(np.sum(probabilities[46:]))

        # Confidence: Probability mass within +-5 years of predicted age
        min_idx = max(0, int(np.floor(predicted_age - 5)))
        max_idx = min(100, int(np.ceil(predicted_age + 5)))
        confidence = float(np.clip(np.sum(probabilities[min_idx:max_idx + 1]), 0.0, 1.0))

        # Normalize age bins to strictly sum to 1.0
        bins = {
            "18-25": p_18_25,
            "26-35": p_26_35,
            "36-45": p_36_45,
            "46+": p_46_plus
        }
        total = sum(bins.values())
        if total > 0:
            bins = {k: round(v / total, 3) for k, v in bins.items()}
        else:
            bins = {"18-25": 0.1, "26-35": 0.65, "36-45": 0.2, "46+": 0.05}

        # Fix minor floating point sum discrepancy if needed
        s = sum(bins.values())
        if abs(s - 1.0) > 1e-4:
            mk = max(bins, key=lambda k: bins[k])
            bins[mk] = round(bins[mk] + (1.0 - s), 3)

        return ModelPrediction(
            model_name="face",
            predicted_age=round(max(0.0, min(120.0, predicted_age)), 1),
            confidence=round(max(0.0, min(1.0, confidence)), 3),
            age_bins=bins,
        )

    except Exception as e:
        print(f"[face_adapter] inference failed ({e}), fallback to mock")
        import traceback; traceback.print_exc()
        fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
        if str(fusion_layer_path) not in sys.path:
            sys.path.insert(0, str(fusion_layer_path))
        from mock_models.face_mock import face_mock
        return face_mock("middle")


# ---------------------------------------------------------------------------
# 4. Adapter Entry Point for Assessment Service
# ---------------------------------------------------------------------------
def run_face_adapter(input_ref: Dict[str, Optional[str]]) -> ModelPrediction:
    """
    Adapter entry point called by assessment_service.py.
    """
    # Check explicit file path or raw bytes first
    if input_ref.get("file_path"):
        return predict_face_from_image(input_ref["file_path"])
    if input_ref.get("image_bytes"):
        return predict_face_from_image(input_ref["image_bytes"])

    file_url = (input_ref or {}).get("file_url")
    if file_url:
        maybe_path = Path(file_url)
        if maybe_path.exists() and maybe_path.is_file():
            return predict_face_from_image(str(maybe_path))

        alt = Path("/tmp") / Path(file_url).name
        if alt.exists():
            return predict_face_from_image(str(alt))

    # If filename only without disk file, run real model on synthetic test input or mock
    print(f"[face_adapter] input reference: {file_url}, running real model / mock")
    fusion_layer_path = Path(__file__).resolve().parents[3] / "fusion-layer"
    if str(fusion_layer_path) not in sys.path:
        sys.path.insert(0, str(fusion_layer_path))
    from mock_models.face_mock import face_mock
    return face_mock("middle")
