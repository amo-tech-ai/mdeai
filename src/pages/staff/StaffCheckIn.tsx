/**
 * /staff/check-in/:event_id?token=<staff_jwt>
 *
 * Installable PWA scanner for door staff. No Supabase auth — the staff JWT
 * passed in the URL query string is the authentication mechanism. The JWT is
 * persisted to sessionStorage so it survives page refresh.
 *
 * Scan flow:
 *   jsQR detects QR → 5s debounce → POST ticket-validate → green/red flash.
 *   Offline: scan queued in IndexedDB → flushed on reconnect.
 *
 * Realtime: subscribes to event_attendees for the live attended/sold counter.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Volume2, VolumeX, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScanner } from "@/hooks/useScanner";
import { Scanner } from "@/components/staff/Scanner";
import { ResultBanner, type ScanResult } from "@/components/staff/ResultBanner";
import { OfflineQueue } from "@/components/staff/OfflineQueue";
import { enqueue, flushQueue } from "@/lib/scanQueue";
import { supabase } from "@/integrations/supabase/client";

const STAFF_TOKEN_KEY = "mde_staff_token";

// ---------------------------------------------------------------------------
// Types from ticket-validate edge function
// ---------------------------------------------------------------------------
interface ValidateResponse {
  valid: boolean;
  attendee_name?: string;
  tier_name?: string;
  error_code?: string;
  error_message?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStoredToken(searchParams: URLSearchParams): string | null {
  const fromUrl = searchParams.get("token");
  if (fromUrl) {
    sessionStorage.setItem(STAFF_TOKEN_KEY, fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem(STAFF_TOKEN_KEY);
}

function getMuted(): boolean {
  return localStorage.getItem("mde_scan_mute") === "1";
}

function setMuted(val: boolean) {
  localStorage.setItem("mde_scan_mute", val ? "1" : "0");
}

// Tiny AudioContext beeps — no external audio files needed.
function beepSuccess() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch { /* AudioContext may be blocked */ }
}

function beepError() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sawtooth";
    o.frequency.value = 220;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch { /* AudioContext may be blocked */ }
}

function humanizeError(code?: string, message?: string): string {
  const map: Record<string, string> = {
    ALREADY_USED: "Already scanned",
    WRONG_EVENT: "Wrong event",
    REFUNDED: "Ticket refunded",
    CANCELLED: "Ticket cancelled",
    NOT_FOUND: "QR not recognized",
    JWT_EXPIRED: "Staff link expired — ask organizer for a new link",
  };
  return map[code ?? ""] ?? message ?? "Validation failed";
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function StaffCheckIn() {
  const { event_id } = useParams<{ event_id: string }>();
  const [searchParams] = useSearchParams();

  const staffToken = getStoredToken(searchParams);
  const [muted, setMutedState] = useState(getMuted);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [attended, setAttended] = useState<number>(0);
  const [sold, setSold] = useState<number>(0);
  const [eventName, setEventName] = useState<string>("");
  const [tokenExpired, setTokenExpired] = useState(false);
  const processingRef = useRef(false);

  // Fetch initial counter + event name
  useEffect(() => {
    if (!event_id || !staffToken) return;
    supabase
      .from("event_tickets")
      .select("qty_sold.sum()")
      .eq("event_id", event_id)
      .single()
      .then(({ data }) => {
        if (data) setSold((data as { sum: number }).sum ?? 0);
      });
    supabase
      .from("event_attendees")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .not("qr_used_at", "is", null)
      .then(({ count }) => { if (count !== null) setAttended(count); });
    supabase
      .from("events")
      .select("name")
      .eq("id", event_id)
      .single()
      .then(({ data }) => { if (data) setEventName(data.name); });
  }, [event_id, staffToken]);

  // Realtime: watch event_attendees for check-in updates
  useEffect(() => {
    if (!event_id) return;
    const channel = supabase
      .channel(`staff-checkin:${event_id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_attendees", filter: `event_id=eq.${event_id}` },
        (payload) => {
          if (payload.new && (payload.new as { qr_used_at: string | null }).qr_used_at) {
            setAttended((n) => n + 1);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [event_id]);

  // Online: flush IndexedDB queue
  useEffect(() => {
    const flush = () => {
      if (!navigator.onLine || !event_id || !staffToken) return;
      flushQueue(async (scan) => {
        try {
          const res = await callValidate(scan.qr_token, event_id, staffToken);
          return { ok: res.valid, permanent: !res.valid && !!res.error_code };
        } catch {
          return { ok: false, permanent: false };
        }
      });
    };
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [event_id, staffToken]);

  // ---------------------------------------------------------------------------
  // Core validate call
  // ---------------------------------------------------------------------------
  async function callValidate(qrToken: string, evId: string, token: string): Promise<ValidateResponse> {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ticket-validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qr_token: qrToken, event_id: evId }),
    });
    if (res.status === 401) {
      setTokenExpired(true);
      return { valid: false, error_code: "JWT_EXPIRED" };
    }
    return res.json() as Promise<ValidateResponse>;
  }

  const handleQr = useCallback(async (qrData: string) => {
    if (!event_id || !staffToken || processingRef.current) return;
    processingRef.current = true;
    try {
      if (!navigator.onLine) {
        await enqueue({ qr_token: qrData, event_id, scanned_at: new Date().toISOString() });
        setScanResult({ status: "queued" });
        return;
      }
      const result = await callValidate(qrData, event_id, staffToken);
      if (result.valid) {
        setScanResult({ status: "success", name: result.attendee_name ?? "—", tier: result.tier_name ?? "" });
        if (!muted) beepSuccess();
      } else {
        setScanResult({ status: "error", reason: humanizeError(result.error_code, result.error_message) });
        if (!muted) beepError();
      }
    } catch {
      // Network error — queue it
      await enqueue({ qr_token: qrData, event_id, scanned_at: new Date().toISOString() });
      setScanResult({ status: "queued" });
    } finally {
      processingRef.current = false;
    }
  }, [event_id, staffToken, muted]);

  const { videoRef, canvasRef, cameraState, restartCamera } = useScanner({
    onDetected: handleQr,
    enabled: !manualOpen && !tokenExpired && !!staffToken,
  });

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleQr(manualCode.trim());
    setManualCode("");
    setManualOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Guard: no token
  // ---------------------------------------------------------------------------
  if (!staffToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6 text-center">
        <div>
          <p className="text-xl font-semibold">Staff link required</p>
          <p className="mt-2 text-sm text-white/60">
            Open the link sent by the event organizer.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Guard: expired JWT
  // ---------------------------------------------------------------------------
  if (tokenExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6 text-center">
        <div>
          <p className="text-xl font-semibold">Staff link expired</p>
          <p className="mt-2 text-sm text-white/60">
            Ask the organizer for a new check-in link.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-dvh bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex-none px-4 py-3 bg-black/90 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{eventName || "Event Check-in"}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-white/70">
              Attended: <span className="text-white font-medium">{attended}</span>
              {sold > 0 ? ` / ${sold}` : ""}
            </span>
            <OfflineQueue />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white h-8 w-8 p-0"
            onClick={toggleMute}
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white h-8 w-8 p-0"
            onClick={() => setManualOpen((o) => !o)}
            aria-label="Manual entry"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Scanner */}
      <Scanner
        videoRef={videoRef}
        canvasRef={canvasRef}
        cameraState={cameraState}
        onRestart={restartCamera}
        onManualEntry={() => setManualOpen(true)}
      />

      {/* Manual entry panel */}
      {manualOpen && (
        <div className="flex-none bg-zinc-900 px-4 py-4 border-t border-white/10">
          <form onSubmit={submitManual} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter QR code or order ID…"
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 focus-visible:ring-emerald-500"
              autoFocus
              data-testid="manual-code-input"
            />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Validate
            </Button>
            <Button type="button" variant="ghost" className="text-white/70" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
          </form>
        </div>
      )}

      {/* Full-screen result flash */}
      <ResultBanner result={scanResult} onClear={() => setScanResult(null)} />
    </div>
  );
}
