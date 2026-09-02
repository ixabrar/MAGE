"""
Separate python script to predict dorsal hand age using resnet18_consistent_age_best.pth
Usage: python predict_hand_separate.py /path/to/hand.jpg
Fixed: correctly maps backbone.* and age_distribution_head -> fc (was missing before causing random 0.0-56.0 variance)
"""

import sys
import os
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json

REPRESENTATIVE_AGES = {"18-25": 21.5, "26-35": 30.5, "36-45": 40.5, "46+": 70.0}
BINS = ["18-25", "26-35", "36-45", "46+"]

def find_model_path():
    candidates = [
        Path(__file__).parent / "backend" / "src" / "models" / "resnet18_consistent_age_best.pth",
        Path(__file__).parent / "resnet18_consistent_age_best.pth",
        Path("/Users/sandeepmadiwal/Vinaa/MAGE/backend/src/models/resnet18_consistent_age_best.pth"),
        Path("/Users/sandeepmadiwal/Vinaa/MAGE/resnet18_consistent_age_best.pth"),
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(f"Model not found in {candidates}")

def load_model():
    ckpt_path = find_model_path()
    print(f"Loading {ckpt_path} ({ckpt_path.stat().st_size/1024/1024:.1f} MB)")
    ckpt = torch.load(str(ckpt_path), map_location="cpu")
    config = ckpt.get("config", {})
    state = ckpt.get("model_state_dict") or ckpt.get("state_dict") or ckpt.get("model") or ckpt
    clean = {}
    for k, v in state.items():
        nk = k[7:] if k.startswith("module.") else k
        if nk.startswith("backbone."):
            nk = nk[len("backbone."):]
        if nk.startswith("age_distribution_head."):
            nk = nk.replace("age_distribution_head.", "fc.")
        clean[nk] = v
    clean.pop("representative_ages", None)
    # infer
    num_classes = clean["fc.weight"].shape[0] if "fc.weight" in clean else 4
    print(f"Checkpoint epoch {ckpt.get('epoch')} best MAE {ckpt.get('best_val_mae'):.3f} num_classes {num_classes}")
    print(f"Config ages {REPRESENTATIVE_AGES}")
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(512, num_classes)
    missing, unexpected = model.load_state_dict(clean, strict=False)
    print(f"Load missing {len(missing)} unexpected {len(unexpected)} (should be 0 and 0-1)")
    if missing:
        print("missing:", missing[:3])
    model.eval()
    return model, config, num_classes

def preprocess(image_path):
    img = Image.open(image_path).convert("RGB")
    print(f"Original image {img.size} mode {img.mode}")
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    tensor = transform(img).unsqueeze(0)
    print(f"Tensor {tensor.shape} mean {tensor.mean():.3f} std {tensor.std():.3f}")
    return tensor

def predict(image_path):
    model, config, num_classes = load_model()
    rep = config.get("representative_ages", REPRESENTATIVE_AGES) if config else REPRESENTATIVE_AGES
    tensor = preprocess(image_path)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
        print(f"Logits {logits[0].cpu().numpy()}")
        print(f"Probs {dict(zip(BINS, probs))}")
        pred_age = float(sum(probs[i] * rep[b] for i, b in enumerate(BINS)))
        conf = float(probs.max())
        age_bins = {b: float(probs[i]) for i, b in enumerate(BINS)}
        print("\n=== RESULT (real ResNet18, not mock) ===")
        print(f"Predicted age: {pred_age:.1f} years (sum P*rep, 46+ rep=70.0)")
        print(f"Confidence: {conf:.3f} (max prob)")
        print(f"Age bins: {json.dumps({k: round(v,3) for k,v in age_bins.items()}, indent=2)}")
        print(f"Top bin: {BINS[probs.argmax()]}")
        # Also show what old buggy loader would have given (random fc) for comparison
        return pred_age, conf, age_bins

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} /path/to/hand.jpg")
        sys.exit(1)
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        sys.exit(1)
    try:
        torch.set_num_threads(1)
        torch.set_num_interop_threads(1)
    except: pass
    predict(image_path)
