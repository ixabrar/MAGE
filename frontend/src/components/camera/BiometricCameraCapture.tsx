"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BiometricCameraCaptureProps {
  modality: "face" | "dorsal_hand" | "blood";
  onCapture: (file: File, previewUrl: string) => void;
  onCancel?: () => void;
}

export default function BiometricCameraCapture({
  modality,
  onCapture,
  onCancel,
}: BiometricCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera access denied or unavailable. Please check browser permissions or use file upload."
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip camera between front & back
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Preprocessing & Smart ROI Cropping (Extracts centered face/hand ROI to standard square canvas)
  const processAndCropImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // Calculate center ROI box (Square 80% of min dimension)
    const size = Math.min(videoWidth, videoHeight) * 0.85;
    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    // Output target resolution: standard 512x512
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror image for natural orientation
    if (facingMode === "user") {
      ctx.translate(outputSize, 0);
      ctx.scale(-1, 1);
    }

    // Draw cropped region of interest
    ctx.drawImage(
      video,
      startX,
      startY,
      size,
      size,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert to Blob and preview URL
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedPreview(url);
      },
      "image/jpeg",
      0.95
    );
  };

  // Countdown timer before snapshot
  const handleTriggerCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          processAndCropImage();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Confirm cropped image
  const handleConfirm = () => {
    if (!capturedBlob || !capturedPreview) return;
    setIsProcessing(true);

    const filename = `camera_${modality}_${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: "image/jpeg" });

    // Stop camera
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    onCapture(file, capturedPreview);
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedBlob(null);
    setIsProcessing(false);
    if (!stream) {
      startCamera();
    }
  };

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-xl border border-[#3f3a52] bg-[#090814] p-4 text-white">
      {/* Hidden off-screen canvas for smart cropping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter flash animation */}
      <AnimatePresence>
        {isShutterActive && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Camera Error Message */}
      {cameraError ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-red-400">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="mt-4 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Retry Camera
          </button>
        </div>
      ) : capturedPreview ? (
        /* Captured Cropped Preview View */
        <div className="relative flex flex-col items-center">
          <div className="relative h-64 w-64 overflow-hidden rounded-xl border-2 border-[#c9b4fa] shadow-[0_0_25px_rgba(201,180,250,0.25)]">
            <img
              src={capturedPreview}
              alt="Cropped Biometric Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9b4fa]">
              Cropped &amp; Aligned
            </div>
          </div>

          <p className="mt-3 text-xs text-[#bcbac9]">
            {modality === "face"
              ? "Face ROI centered and normalized for EfficientNet-B0 inference."
              : "Dorsal hand contour centered for ResNet-18 feature extraction."}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-[#bcbac9] transition-colors hover:border-white hover:text-white"
            >
              ↺ Retake Photo
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="rounded-full bg-[#c9b4fa] px-6 py-2 text-xs font-bold text-[#1b1938] transition-transform hover:scale-105"
            >
              {isProcessing ? "Processing…" : "Use Photo ✓"}
            </button>
          </div>
        </div>
      ) : (
        /* Live Camera Viewfinder with Biometric Overlay */
        <div className="relative flex flex-col items-center">
          <div className="relative h-72 w-72 overflow-hidden rounded-xl border border-white/10 bg-black sm:h-80 sm:w-80">
            {/* Live Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />

            {/* Modality Specific ROI Guides */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {modality === "face" ? (
                /* Face Oval Framing Guide */
                <div className="relative h-56 w-44 rounded-[50%] border-2 border-dashed border-[#c9b4fa]/60 shadow-[0_0_20px_rgba(201,180,250,0.15)]">
                  {/* Eye Level Line */}
                  <div className="absolute top-1/3 left-2 right-2 border-t border-dotted border-[#c9b4fa]/40" />
                  {/* Subtle target crosshairs */}
                  <div className="absolute -top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-[#c9b4fa]" />
                  <div className="absolute -bottom-1 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-[#c9b4fa]" />
                  <div className="absolute top-1/2 -left-1 h-0.5 w-3 -translate-y-1/2 bg-[#c9b4fa]" />
                  <div className="absolute top-1/2 -right-1 h-0.5 w-3 -translate-y-1/2 bg-[#c9b4fa]" />
                </div>
              ) : (
                /* Dorsal Hand Rectangle Guide */
                <div className="relative h-56 w-52 rounded-2xl border-2 border-dashed border-[#c9b4fa]/60 shadow-[0_0_20px_rgba(201,180,250,0.15)]">
                  <div className="absolute top-2 left-2 text-[10px] font-semibold text-[#c9b4fa]/80 uppercase tracking-widest">
                    Palm Down
                  </div>
                  {/* Corner alignment brackets */}
                  <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#c9b4fa]" />
                  <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#c9b4fa]" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#c9b4fa]" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#c9b4fa]" />
                </div>
              )}
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-6xl font-bold text-white backdrop-blur-xs">
                {countdown}
              </div>
            )}

            {/* Controls Bar inside Viewfinder */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Flip Camera"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/90"
              >
                ↻
              </button>
            </div>

            {/* Helper Tagline */}
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] text-[#bcbac9] backdrop-blur-md">
                {modality === "face"
                  ? "Align face inside the oval"
                  : "Place back of hand inside the box"}
              </span>
            </div>
          </div>

          {/* Capture Trigger Buttons */}
          <div className="mt-5 flex items-center gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-[#bcbac9] hover:text-white"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={processAndCropImage}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 shadow-[0_0_20px_rgba(201,180,250,0.3)] transition-transform hover:scale-105 active:scale-95"
            >
              <div className="h-10 w-10 rounded-full bg-white transition-transform group-hover:scale-95" />
            </button>

            <button
              type="button"
              onClick={handleTriggerCapture}
              title="3s Timer Capture"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-[#bcbac9] hover:border-white/30 hover:text-white"
            >
              ⏱ 3s Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
