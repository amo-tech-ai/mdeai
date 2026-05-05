import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { queueSize } from "@/lib/scanQueue";

export function OfflineQueue() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      queueSize().then(setPending).catch(() => {});
    };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const interval = setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      clearInterval(interval);
    };
  }, []);

  if (online && pending === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400" aria-label="Online">
        <Wifi className="h-3.5 w-3.5" /> Online
      </span>
    );
  }

  if (!online) {
    return (
      <span
        className="flex items-center gap-1 text-xs text-red-400 font-medium"
        aria-label={`Offline, ${pending} pending scans`}
      >
        <WifiOff className="h-3.5 w-3.5" />
        Offline · {pending} pending
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 text-xs text-amber-400 font-medium"
      aria-label={`${pending} scans syncing`}
    >
      <Wifi className="h-3.5 w-3.5 animate-pulse" />
      Syncing {pending}…
    </span>
  );
}
