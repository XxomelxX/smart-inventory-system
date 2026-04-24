import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, ScanBarcode, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => boolean; // return true if product was found/added
};

export const BarcodeScanner = ({ open, onClose, onDetected }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [recent, setRecent] = useState<{ code: string; ok: boolean; at: number }[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  const start = async (preferredId?: string) => {
    setError(null);
    setStarting(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);
      const chosen =
        preferredId ||
        cams.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
        cams[0]?.deviceId;
      setDeviceId(chosen);

      if (!videoRef.current) return;
      controlsRef.current = await reader.decodeFromVideoDevice(
        chosen,
        videoRef.current,
        (result) => {
          if (!result) return;
          const code = result.getText();
          const now = Date.now();
          // debounce repeats within 1.2s
          if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.at < 1200) return;
          lastScanRef.current = { code, at: now };
          const ok = onDetected(code);
          setRecent((prev) => [{ code, ok, at: now }, ...prev].slice(0, 6));
          if (ok) {
            try {
              // tiny beep
              const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.frequency.value = 880;
              o.connect(g); g.connect(ctx.destination);
              g.gain.setValueAtTime(0.15, ctx.currentTime);
              o.start();
              o.stop(ctx.currentTime + 0.08);
            } catch { /* ignore */ }
          }
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera error";
      setError(msg);
      toast.error("Cannot access camera: " + msg);
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
      setRecent([]);
      lastScanRef.current = null;
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(idx + 1) % devices.length];
    stop();
    await start(next.deviceId);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-accent" /> Scan Product
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode. Detected items are added to the cart automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {/* overlay frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-1/2 w-3/4 rounded-lg border-2 border-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              <Camera className="h-4 w-4 mr-2 animate-pulse" /> Starting camera…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-sm p-4 text-center">
              <CameraOff className="h-6 w-6" />
              {error}
              <Button size="sm" variant="secondary" onClick={() => start()}>
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={switchCamera} disabled={devices.length < 2}>
            <RefreshCw className="h-3 w-3" /> Switch camera ({devices.length})
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Done</Button>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent scans</h4>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">No scans yet.</p>
          ) : (
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {recent.map((r) => (
                <li key={r.at} className="flex items-center justify-between text-xs border-b py-1">
                  <span className="font-mono">{r.code}</span>
                  {r.ok ? (
                    <Badge variant="secondary" className="text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-primary" /> Added
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Not found</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
