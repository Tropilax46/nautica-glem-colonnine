import { useEffect, useState } from "react";

/**
 * Invito ad "installare l'app" (in realtà aggiunge una scorciatoia del sito alla home).
 * Compare SOLO su smartphone e se l'app non è già installata.
 * - Android/Chrome: usa l'evento beforeinstallprompt → installazione con un tap.
 * - iOS/Safari: non supporta l'installazione automatica → mostra le istruzioni
 *   "Condividi → Aggiungi a Home".
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (!isMobile || standalone) return;
    try { if (localStorage.getItem("glem_pwa_dismiss") === "1") return; } catch {}

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    if (isIOS) {
      setIos(true);
      setShow(true);
      return;
    }
    const onBip = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => setShow(false));
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem("glem_pwa_dismiss", "1"); } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md p-3">
      <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <div className="flex-1">
            <p className="font-semibold text-glem-700">Scarica l'app Nautica GLEM</p>
            {ios ? (
              <p className="mt-1 text-sm text-slate-500">
                Tocca <span className="font-semibold">Condividi</span>{" "}
                <span aria-hidden>⬆️</span> in basso, poi{" "}
                <span className="font-semibold">“Aggiungi a Home”</span>.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Aggiungila alla schermata Home per aprirla come un'app, anche offline.
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {!ios && (
            <button onClick={install} className="btn-primary flex-1">
              Aggiungi alla Home
            </button>
          )}
          <button
            onClick={dismiss}
            className={`rounded-xl px-4 py-3 font-semibold text-slate-500 ${ios ? "w-full" : ""}`}
          >
            {ios ? "Ho capito" : "Più tardi"}
          </button>
        </div>
      </div>
    </div>
  );
}
