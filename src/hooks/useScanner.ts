/**
 * useScanner — camera lifecycle + jsQR decode loop.
 *
 * Manages getUserMedia, draws each frame to a hidden canvas, decodes with
 * jsQR, and fires `onDetected` at most once per unique QR per 5 seconds
 * (debounce). Resets the video stream every 60 s to guard against jsQR
 * memory leaks after hundreds of scans.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import jsQR from "jsqr";

const DEBOUNCE_MS = 5_000;
const STREAM_RESET_MS = 60_000;

export type CameraState = "idle" | "requesting" | "active" | "denied" | "unsupported";

export interface UseScannerOptions {
  onDetected: (qrData: string) => void;
  enabled: boolean;
}

export function useScanner({ onDetected, enabled }: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastDetectedRef = useRef<Map<string, number>>(new Map());
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startStream = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("active");

      function tick() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) {
          const now = Date.now();
          const last = lastDetectedRef.current.get(code.data) ?? -Infinity;
          if (now - last > DEBOUNCE_MS) {
            lastDetectedRef.current.set(code.data, now);
            onDetected(code.data);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);

      // Restart the stream every 60s to prevent memory buildup
      resetTimerRef.current = setTimeout(() => {
        stopStream();
        startStream();
      }, STREAM_RESET_MS);
    } catch (err) {
      const name = (err as Error).name;
      setCameraState(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied" : "unsupported");
    }
  }, [onDetected, stopStream]);

  useEffect(() => {
    if (!enabled) { stopStream(); setCameraState("idle"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState("unsupported"); return; }
    startStream();
    return stopStream;
  }, [enabled, startStream, stopStream]);

  return { videoRef, canvasRef, cameraState, restartCamera: startStream };
}
