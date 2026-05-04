import { RefObject } from "react";
import type { CameraState } from "@/hooks/useScanner";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraState: CameraState;
  onRestart: () => void;
  /** Called when user opts for manual code entry */
  onManualEntry: () => void;
}

export function Scanner({ videoRef, canvasRef, cameraState, onRestart, onManualEntry }: ScannerProps) {
  return (
    <div className="relative flex-1 bg-black overflow-hidden">
      {/* Hidden canvas used by jsQR decode loop — never shown */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Camera viewfinder */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        aria-label="Camera viewfinder"
      />

      {/* Crosshair overlay */}
      {cameraState === "active" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 relative">
            {/* Corner marks */}
            <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-sm" />
          </div>
        </div>
      )}

      {/* Camera unavailable states */}
      {cameraState === "requesting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
          <Camera className="h-10 w-10 animate-pulse" />
          <p className="text-sm">Requesting camera…</p>
        </div>
      )}

      {cameraState === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4 px-6 text-center">
          <CameraOff className="h-12 w-12 text-red-400" />
          <p className="font-semibold">Camera access denied</p>
          <p className="text-sm text-white/70">
            Allow camera in your browser settings, then tap retry.
          </p>
          <Button variant="outline" size="sm" className="bg-white text-black" onClick={onRestart}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry camera
          </Button>
          <Button variant="ghost" size="sm" className="text-white/80" onClick={onManualEntry}>
            Enter code manually
          </Button>
        </div>
      )}

      {(cameraState === "idle" || cameraState === "unsupported") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4 px-6 text-center">
          <CameraOff className="h-12 w-12 text-amber-400" />
          <p className="font-semibold">
            {cameraState === "unsupported" ? "Camera not supported" : "Camera inactive"}
          </p>
          <Button variant="ghost" size="sm" className="text-white/80" onClick={onManualEntry}>
            Enter code manually
          </Button>
        </div>
      )}
    </div>
  );
}
