"""ResNet18 whose age estimate is the expectation of one bin distribution.

There is intentionally no independent regression head in this experiment.
"""

from __future__ import annotations

from typing import Dict, Mapping, Sequence

import torch
import torch.nn as nn
from torchvision import models


AGE_BIN_LABELS = ("18-25", "26-35", "36-45", "46+")
DEFAULT_REPRESENTATIVE_AGES = (21.5, 30.5, 40.5, 70.0)


def age_to_bin(age: float) -> int:
    """Map an age to one of the four requested output bins."""
    if age < 26:
        return 0
    if age < 36:
        return 1
    if age < 46:
        return 2
    return 3


class ResNet18ConsistentAge(nn.Module):
    """ImageNet-pretrained ResNet18 -> four logits -> probabilities -> age.

    ``predicted_age`` is always ``probabilities @ representative_ages``.  The
    512-D feature tensor is returned for later multimodal fusion.
    """

    def __init__(
        self,
        representative_ages: Sequence[float] = DEFAULT_REPRESENTATIVE_AGES,
        freeze_backbone: bool = False,
    ) -> None:
        super().__init__()
        if len(representative_ages) != len(AGE_BIN_LABELS):
            raise ValueError("One representative age is required for each output bin.")
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        feature_dim = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        self.age_distribution_head = nn.Linear(feature_dim, len(AGE_BIN_LABELS))
        self.register_buffer("representative_ages", torch.tensor(representative_ages, dtype=torch.float32))

        if freeze_backbone:
            for block in (self.backbone.conv1, self.backbone.bn1, self.backbone.layer1, self.backbone.layer2, self.backbone.layer3):
                for parameter in block.parameters():
                    parameter.requires_grad = False

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        features = self.backbone(x)
        logits = self.age_distribution_head(features)
        probabilities = torch.softmax(logits, dim=1)
        predicted_age = probabilities @ self.representative_ages
        return {
            "features": features,
            "age_distribution_logits": logits,
            "age_bin_probabilities": probabilities,
            "predicted_age": predicted_age.unsqueeze(1),
            "confidence": probabilities.max(dim=1).values,
        }

    @torch.inference_mode()
    def predict(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Return the complete consistent prediction API for a tensor batch."""
        return self.forward(x)

    def get_model_info(self) -> Mapping[str, object]:
        return {
            "architecture": "ResNet18_Consistent_Age_Distribution",
            "backbone": "ResNet18 (ImageNet pretrained)",
            "feature_dim": 512,
            "age_bins": list(AGE_BIN_LABELS),
            "representative_ages": self.representative_ages.detach().cpu().tolist(),
            "age_formula": "sum(P(bin) * representative_age(bin))",
            "confidence_formula": "max(age_bin_probabilities)",
            "has_independent_regression_head": False,
        }
