import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export type ScanResult =
  | { status: "success"; name: string; tier: string }
  | { status: "error"; reason: string }
  | { status: "queued" }
  | null;

interface ResultBannerProps {
  result: ScanResult;
  onClear: () => void;
}

const SUCCESS_DURATION = 3_000;
const ERROR_DURATION = 3_000;
const QUEUED_DURATION = 2_500;

export function ResultBanner({ result, onClear }: ResultBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result) { setVisible(false); return; }
    setVisible(true);
    const dur =
      result.status === "success" ? SUCCESS_DURATION :
      result.status === "queued" ? QUEUED_DURATION : ERROR_DURATION;
    const t = setTimeout(() => { setVisible(false); onClear(); }, dur);
    return () => clearTimeout(t);
  }, [result, onClear]);

  if (!visible || !result) return null;

  if (result.status === "success") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/90 backdrop-blur-sm animate-in fade-in duration-150"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center text-white">
          <CheckCircle2 className="mx-auto h-16 w-16 mb-3" />
          <p className="text-2xl font-bold">{result.name}</p>
          <p className="text-lg opacity-90 mt-1">{result.tier}</p>
        </div>
      </div>
    );
  }

  if (result.status === "queued") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-amber-500/90 backdrop-blur-sm animate-in fade-in duration-150"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center text-white">
          <Clock className="mx-auto h-16 w-16 mb-3" />
          <p className="text-2xl font-bold">Queued</p>
          <p className="text-lg opacity-90 mt-1">Will sync when online</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-600/90 backdrop-blur-sm animate-in fade-in duration-150"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center text-white">
        <XCircle className="mx-auto h-16 w-16 mb-3" />
        <p className="text-2xl font-bold">Denied</p>
        <p className="text-lg opacity-90 mt-1 max-w-xs px-4">{result.reason}</p>
      </div>
    </div>
  );
}
