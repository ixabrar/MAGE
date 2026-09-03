"""
Image biometric validation service.

Validates uploaded face and dorsal hand images before neural network inference
to reject random, non-human, corrupted, or mismatched inputs.
"""

from typing import Tuple, Dict, Any, Union
from pathlib import Path
import io
import math
import numpy as np
from PIL import Image

try:
    import cv2
    _cv2_available = True
except Exception:
    cv2 = None
    _cv2_available = False


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


def _calculate_skin_ratio(rgb_arr: np.ndarray) -> float:
    """
    Calculate the percentage of pixels falling into standard human skin color loci.
    Covers diverse ethnic skin tones in normalized RGB and YCbCr space.
    """
    r = rgb_arr[:, :, 0].astype(float)
    g = rgb_arr[:, :, 1].astype(float)
    b = rgb_arr[:, :, 2].astype(float)

    # Condition 1: Universal RGB skin pigment bounds
    cond_rgb = (
        (r > 80)
        & (g > 35)
        & (b > 20)
        & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 12)
        & (np.abs(r - g) > 10)
        & (r > g)
        & (r > b)
    )

    # Condition 2: YCbCr skin cluster (Cb: 77..127, Cr: 133..173)
    # Y = 0.299R + 0.587G + 0.114B
    # Cb = 128 - 0.168736R - 0.331264G + 0.5B
    # Cr = 128 + 0.5R - 0.418688G - 0.081312B
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    cond_ycbcr = (cb >= 75) & (cb <= 130) & (cr >= 130) & (cr <= 178)

    skin_mask = cond_rgb | cond_ycbcr
    return float(np.mean(skin_mask))


def _calculate_blur_score(gray_arr: np.ndarray) -> float:
    """Calculate image sharpness via variance of Laplacian filter."""
    if _cv2_available and cv2 is not None:
        try:
            return float(cv2.Laplacian(gray_arr, cv2.CV_64F).var())
        except Exception:
            pass
    # Fallback: discrete 2D Laplacian kernel via numpy
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=float)
    # Quick approximation on downscaled array
    h, w = gray_arr.shape
    if h > 300 or w > 300:
        step = max(1, min(h, w) // 200)
        sampled = gray_arr[::step, ::step].astype(float)
    else:
        sampled = gray_arr.astype(float)

    # Convolve center
    lap = (
        sampled[:-2, 1:-1]
        + sampled[2:, 1:-1]
        + sampled[1:-1, :-2]
        + sampled[1:-1, 2:]
        - 4 * sampled[1:-1, 1:-1]
    )
    return float(np.var(lap))


def validate_face_image(image_input: Union[str, bytes, bytearray, Path, Image.Image]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validate that the uploaded image contains a real, detectable human face.

    Returns:
        (is_valid: bool, message: str, metadata: dict)
    """
    try:
        img = _load_pil_image(image_input)
    except Exception as e:
        return False, f"Invalid or unreadable image file: {str(e)}", {}

    w, h = img.size
    if w < 96 or h < 96:
        return False, f"Image resolution is too low ({w}x{h}). Minimum required is 100x100 pixels.", {}

    rgb_arr = np.array(img)
    gray_arr = np.array(img.convert("L"))

    # Check 1: Skin presence (reject cars, nature, documents, walls, solid colors)
    skin_ratio = _calculate_skin_ratio(rgb_arr)
    if skin_ratio < 0.10:
        return False, "No human facial features detected. Please upload a clear photo of a human face.", {
            "skin_ratio": round(skin_ratio, 3)
        }

    # Check 2: If OpenCV is available, run Haar face cascade detection
    if _cv2_available and cv2 is not None:
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = face_cascade.detectMultiScale(gray_arr, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))
            if len(faces) == 0:
                # Try profile face cascade for angled shots
                profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
                faces = profile_cascade.detectMultiScale(gray_arr, scaleFactor=1.1, minNeighbors=3, minSize=(40, 40))

            if len(faces) == 0 and skin_ratio < 0.22:
                return False, "No face detected in the image. Please look straight at the camera with good lighting.", {
                    "skin_ratio": round(skin_ratio, 3)
                }
        except Exception:
            pass

    # Check 3: Check for extreme blurriness
    blur_score = _calculate_blur_score(gray_arr)
    if blur_score < 4.0 and (w * h) > 10000:
        return False, "The image is too blurry or out of focus. Please provide a sharper photo.", {
            "blur_score": round(blur_score, 2)
        }

    return True, "Valid face detected.", {
        "width": w,
        "height": h,
        "skin_ratio": round(skin_ratio, 3),
        "blur_score": round(blur_score, 2),
    }


def validate_dorsal_hand_image(image_input: Union[str, bytes, bytearray, Path, Image.Image]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validate that the uploaded image contains a detectable dorsal hand.

    Returns:
        (is_valid: bool, message: str, metadata: dict)
    """
    try:
        img = _load_pil_image(image_input)
    except Exception as e:
        return False, f"Invalid or unreadable image file: {str(e)}", {}

    w, h = img.size
    if w < 96 or h < 96:
        return False, f"Image resolution is too low ({w}x{h}). Minimum required is 100x100 pixels.", {}

    rgb_arr = np.array(img)
    gray_arr = np.array(img.convert("L"))

    # Check 1: Skin ratio check (hand must occupy plausible area 12% - 90%)
    skin_ratio = _calculate_skin_ratio(rgb_arr)
    if skin_ratio < 0.12:
        return False, "No hand detected. Please position the back of your hand facing the camera on a neutral surface.", {
            "skin_ratio": round(skin_ratio, 3)
        }

    # Check 2: Reject if it is clearly a frontal face instead of a hand
    if _cv2_available and cv2 is not None:
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = face_cascade.detectMultiScale(gray_arr, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
            if len(faces) > 0:
                # Face detected where dorsal hand was expected
                return False, "This appears to be a face photo. Please upload a photo of the dorsal (back) of your hand.", {
                    "detected": "face"
                }
        except Exception:
            pass

    # Check 3: Check blur
    blur_score = _calculate_blur_score(gray_arr)
    if blur_score < 4.0 and (w * h) > 10000:
        return False, "Hand photo is too blurry or out of focus. Please ensure good lighting and focus.", {
            "blur_score": round(blur_score, 2)
        }

    return True, "Valid dorsal hand detected.", {
        "width": w,
        "height": h,
        "skin_ratio": round(skin_ratio, 3),
        "blur_score": round(blur_score, 2),
    }
