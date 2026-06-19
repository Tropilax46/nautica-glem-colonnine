import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";

function parseCode(raw: string): string | null {
  try { const u = new URL(raw); const c = u.searchParams.get("c"); if (c) return c.toUpperCase(); } catch {}
  const m = raw.toUpperCase().match(/GLEM-[A-Z]?\d+/);
  return m ? m[0] : null;
}

function Scan() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0; let stopped = false;
    async function run() {
      const BD = (window as any).BarcodeDetector;
      if (!BD || !navigator.mediaDevices?.getUserMedia) { setSupported(false); return; }
      try {
        const detector = new BD({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length) {
              const c = parseCode(codes[0].rawValue || "");
              if (c) { stopped = true; router.replace("/avvia?c=" + encodeURIComponent(c)); return; }
            }
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch { setError("Non riesco ad accedere alla fotocamera. Inserisci il codice manualmente."); setSupported(false); }
    }
    run();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [router]);

  return (
    <Layout title="Scansiona QR">
      {supported && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          </div>
          <p className="text-center text-sm text-slate-500">Inquadra il QR sulla colonnina.</p>
        </div>
      )}

      {!supported && (
        <div className="card space-y-3">
          <p className="text-sm text-slate-600">📷 Lo scanner integrato non è disponibile su questo dispositivo. Usa la <strong>fotocamera del telefono</strong> per inquadrare il QR (si apre da sola), oppure inserisci il codice qui sotto.</p>
          {error && <p className="text-sm text-amber-600">{error}</p>}
          <form onSubmit={(e) => { e.preventDefault(); const c = parseCode(manual) || manual.toUpperCase().trim(); if (c) router.replace("/avvia?c=" + encodeURIComponent(c)); }} className="space-y-3">
            <input className="input font-mono uppercase" placeholder="es. GLEM-A13" value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="btn-primary" disabled={!manual.trim()}>Continua</button>
          </form>
        </div>
      )}
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Scan /></AuthGuard>); }
