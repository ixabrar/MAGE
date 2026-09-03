"""
Image biometric validation service.

Strict biometric verification for Face and Dorsal Hand inputs to prevent
false predictions on random objects, textures, animals, documents, or noise.
"""

from typing import Tuple, Dict, Any, Union
from pathlib import Path
import io
import numpy as np
from PIL import Image


def _load_pil_image(image_input: Union[str, bytes, bytearray, Path, Image.Image]) -> Image.Image:
    """Safely convert any image input to a PIL Image in RGB format."""
    if isinstance(image_input, Image.Image):
        return image_input.convert("RGB")
    elif isinstance(image_input, (bytes, bytearray)):
        return Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, (str, Path)):
        return Image.open(str(image_input)).convert("RGB")
    else:
        raise ValueError("Unsupported image input format.")


def _calculate_skin_metrics(rgb_arr: np.ndarray) -> Tuple[float, np.ndarray, float]:
    """
    Calculate human skin pigment distribution and spatial cluster density across RGB and YCbCr spaces.
    Returns: (skin_ratio, skin_mask, isolated_ratio)
    """
    r = rgb_arr[:, :, 0].astype(float)
    g = rgb_arr[:, :, 1].astype(float)
    b = rgb_arr[:, :, 2].astype(float)

    # Universal RGB skin pigment bounds
    cond_rgb = (
        (r > 60)
        & (g > 30)
        & (b > 15)
        & (r > g)
        & (r > b)
        & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 10)
        & (np.abs(r - g) > 8)
    )

    # YCbCr skin locus (Cb: 70..135, Cr: 125..180)
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    cond_ycbcr = (cb >= 70) & (cb <= 135) & (cr >= 125) & (cr <= 180)

    skin_mask = cond_rgb & cond_ycbcr
    skin_ratio = float(np.mean(skin_mask))

    total_skin_px = np.sum(skin_mask)
    if total_skin_px < 30:
        return 0.0, skin_mask, 1.0

    # Check 3x3 local neighborhood connectivity to reject scattered noise
    pad = np.pad(skin_mask.astype(float), 1, mode="constant")
    neighbor_count = (
        pad[:-2, :-2]
        + pad[:-2, 1:-1]
        + pad[:-2, 2:]
        + pad[1:-1, :-2]
        + pad[1:-1, 2:]
        + pad[2:, :-2]
        + pad[2:, 1:-1]
        + pad[2:, 2:]
    )
    isolated_ratio = float(np.sum((skin_mask) & (neighbor_count < 3)) / max(1, total_skin_px))

    return skin_ratio, skin_mask, isolated_ratio


def _calculate_sharpness(gray_arr: np.ndarray) -> float:
    """Calculate image edge variance (sharpness)."""
    h, w = gray_arr.shape
    if h < 10 or w < 10:
        return 0.0
    lap = (
        gray_arr[:-2, 1:-1]
        + gray_arr[2:, 1:-1]
        + gray_arr[1:-1, :-2]
        + gray_arr[1:-1, 2:]
        - 4 * gray_arr[1:-1, 1:-1]
    )
    return float(np.var(lap))


def validate_face_image(image_input: Union[str, bytes, bytearray, Path, Image.Image]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Strict biometric validation that the image contains an authentic human face.
    """
    try:
        img = _load_pil_image(image_input)
    except Exception as e:
        return False, f"Invalid image file: {str(e)}", {}

    w, h = img.size
    if w < 64 or h < 64:
        return False, f"Image resolution is too low ({w}x{h}). Minimum required is 100x100 pixels.", {}

    img_resized = img.resize((128, 128), Image.Resampling.BILINEAR)
    rgb_arr = np.array(img_resized, dtype=float)
    gray_arr = np.array(img_resized.convert("L"), dtype=float)

    # 1. Skin Chrominance & Spatial Density Check
    skin_ratio, skin_mask, isolated_ratio = _calculate_skin_metrics(rgb_arr)
    if skin_ratio < 0.12 or isolated_ratio > 0.40:
        return False, "No human face or skin detected. Please upload a clear frontal face photo.", {
            "skin_ratio": round(skin_ratio, 3)
        }

    # 2. Structural Contrast Check
    contrast_std = float(np.std(gray_arr))
    if contrast_std < 10.0:
        return False, "Image lacks facial contrast or structural features. Please provide a well-lit photo.", {
            "contrast_std": round(contrast_std, 2)
        }

    # 3. Bilateral Facial Symmetry Check
    left_half = gray_arr[:, :64]
    right_mirrored = np.fliplr(gray_arr[:, 64:])
    left_std = float(np.std(left_half))
    right_std = float(np.std(right_mirrored))
    if left_std < 4.0 or right_std < 4.0:
        return False, "Image does not contain recognizable facial landmarks.", {}

    symmetry_corr = float(np.corrcoef(left_half.flatten(), right_mirrored.flatten())[0, 1])
    if np.isnan(symmetry_corr) or symmetry_corr < 0.28:
        return False, "Image lacks human facial symmetry. Please face the camera directly.", {
            "symmetry_score": round(symmetry_corr, 2) if not np.isnan(symmetry_corr) else 0.0
        }

    # 4. Sharpness check
    sharpness = _calculate_sharpness(gray_arr)
    if sharpness < 2.0 and (w * h) > 10000:
        return False, "The photo is too blurry or out of focus. Please provide a sharper photo.", {
            "sharpness": round(sharpness, 2)
        }

    return True, "Valid human face verified.", {
        "width": w,
        "height": h,
        "skin_ratio": round(skin_ratio, 3),
        "symmetry_score": round(symmetry_corr, 2),
        "sharpness": round(sharpness, 2),
    }


def validate_dorsal_hand_image(image_input: Union[str, bytes, bytearray, Path, Image.Image]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Strict biometric validation that the image contains a dorsal hand.
    """
    try:
        img = _load_pil_image(image_input)
    except Exception as e:
        return False, f"Invalid image file: {str(e)}", {}

    w, h = img.size
    if w < 64 or h < 64:
        return False, f"Image resolution is too low ({w}x{h}). Minimum required is 100x100 pixels.", {}

    img_resized = img.resize((128, 128), Image.Resampling.BILINEAR)
    rgb_arr = np.array(img_resized, dtype=float)
    gray_arr = np.array(img_resized.convert("L"), dtype=float)

    # 1. Skin Chrominance & Spatial Density Check
    skin_ratio, skin_mask, isolated_ratio = _calculate_skin_metrics(rgb_arr)
    if skin_ratio < 0.12 or isolated_ratio > 0.40:
        return False, "No hand detected. Please position the back of your hand facing the camera on a neutral surface.", {
            "skin_ratio": round(skin_ratio, 3)
        }

    # 2. Hand Alignment (lower half must have skin presence from wrist/palm)
    lower_half_skin = float(np.mean(skin_mask[50:, :]))
    if lower_half_skin < 0.08:
        return False, "Hand not aligned properly. Please position the wrist and palm facing into the frame.", {
            "lower_skin_ratio": round(lower_half_skin, 3)
        }

    # 3. Detect & Reject Facial Photo Submitted as Hand
    left_half = gray_arr[:, :64]
    right_mirrored = np.fliplr(gray_arr[:, 64:])
    symmetry_corr = float(np.corrcoef(left_half.flatten(), right_mirrored.flatten())[0, 1])
    
    if not np.isnan(symmetry_corr) and symmetry_corr > 0.75:
        eye_band = gray_arr[32:70, :]
        col_profile = np.mean(eye_band, axis=0)
        forehead = np.mean(gray_arr[10:30, 40:88])
        if np.min(col_profile[20:55]) < forehead * 0.85 and np.min(col_profile[73:108]) < forehead * 0.85:
            return False, "This appears to be a face photo. Please upload a photo of the dorsal (back) of your hand.", {
                "detected": "face"
            }

    # 4. Sharpness check
    sharpness = _calculate_sharpness(gray_arr)
    if sharpness < 2.0 and (w * h) > 10000:
        return False, "The hand photo is too blurry or out of focus. Please provide a sharper photo.", {
            "sharpness": round(sharpness, 2)
        }

    return True, "Valid dorsal hand verified.", {
        "width": w,
        "height": h,
        "skin_ratio": round(skin_ratio, 3),
        "lower_skin_ratio": round(lower_half_skin, 3),
        "sharpness": round(sharpness, 2),
    }
