import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { api, fetcher, SessionOut } from "@/lib/api";

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-glem-700">{value}</p>
      <p className="text-sm text-slate-400">{unit}</p>
    </div>
  );
}

function Sessione() {
  const { data, isLoading, mutate } = useSWR<SessionOut[]>("/sessions/active", fetcher, { refreshInterval: 4000 });
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const stoppedRef = useRef(false);
  const sess = data?.[0];

  async function stop(motivo?: string) {
    if (!sess || stoppedRef.current) return;
    stoppedRef.current = true;
    setStopping(true);
    try {
      await api.delete(`/sessions/${sess.id}`);
      if (motivo) setAutoMsg(motivo);
      await mutate();
    } catch { setError("Errore durante lo stop. Riprova."); stoppedRef.current = false; }
    finally { setStopping(false); }
  }

  // Auto-stop al raggiungimento del debito massimo
  useEffect(() => {
    if (sess?.limite_raggiunto && !stoppedRef.current) {
      stop("Sessione terminata: raggiunto il debito massimo.");
    }
  }, [sess?.limite_raggiunto]); // eslint-disable-line

  async function stopManuale() {
    if (!confirm("Terminare il prelievo e scollegare presa/tubi?")) return;
    await stop();
  }

  return (
    <Layout title="Sessione">
      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}

      {autoMsg && (
        <div className="card mb-4 bg-amber-50 text-center text-sm font-medium text-amber-700">{autoMsg}</div>
      )}

      {!isLoading && !sess && !autoMsg && (
        <div className="card text-center">
          <p className="text-4xl">🔌</p>
          <p className="mt-2 font-semibold">Nessuna sessione attiva</p>
          <p className="mt-1 text-sm text-slate-500">Inquadra il QR di una colonnina o avvia un prelievo.</p>
          <Link href="/avvia" className="btn-primary mt-4 inline-block w-auto px-6 text-center">⚡ Avvia prelievo</Link>
        </div>
      )}

      {sess && (
        <div className="space-y-4">
          <div className="card text-center">
            <p className="text-sm text-slate-500">{sess.colonnina_id} · Presa {sess.presa_n}</p>
            <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">in carica</p>
            <p className="mt-2 text-xs text-slate-400">
              {sess.usa_elettricita && "⚡ Elettricità"} {sess.usa_elettricita && sess.usa_acqua && " · "} {sess.usa_acqua && "💧 Acqua"}
            </p>
          </div>

          {/* Consumi istantanei */}
          <p className="text-sm font-semibold text-slate-600">Adesso</p>
          <div className="grid grid-cols-2 gap-3">
            {sess.usa_elettricita && <Stat label="Potenza" value={sess.potenza_kw.toFixed(1)} unit="kW" />}
            {sess.usa_acqua && <Stat label="Portata" value={sess.flusso_l_min.toFixed(0)} unit="L/min" />}
          </div>

          {/* Consumi complessivi */}
          <p className="text-sm font-semibold text-slate-600">Totale sessione</p>
          <div className="grid grid-cols-2 gap-3">
            {sess.usa_elettricita && <Stat label="Energia" value={sess.kwh.toFixed(2)} unit="kWh" />}
            {sess.usa_acqua && <Stat label="Acqua" value={sess.litri.toFixed(0)} unit="litri" />}
          </div>

          {/* Costo + debito */}
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Costo sessione</span>
              <span className="text-2xl font-bold text-glem-700">{sess.costo_totale.toFixed(2)} €</span>
            </div>
            {sess.usa_elettricita && sess.usa_acqua && (
              <p className="mt-1 text-xs text-slate-400">⚡ {sess.costo_elettricita.toFixed(2)} € · 💧 {sess.costo_acqua.toFixed(2)} €</p>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
              Saldo wallet: <strong>{sess.saldo.toFixed(2)} €</strong> · Debito max: <strong>{sess.max_debito.toFixed(2)} €</strong><br />
              Disponibile prima dello stop: <strong className="text-glem-700">{sess.disponibile.toFixed(2)} €</strong>
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button className="btn-danger" onClick={stopManuale} disabled={stopping}>
            {stopping ? "Arresto in corso…" : "⏹ Termina sessione"}
          </button>
          <p className="text-center text-xs text-slate-400">
            Dati aggiornati ogni 4 secondi. La sessione si interrompe automaticamente al raggiungimento del debito massimo
            o dopo 10 minuti di inattività (quando l'impianto non rileva consumo).
          </p>
        </div>
      )}
    </Layout>
  );
}

export default function Page() {
  return (<AuthGuard><Sessione /></AuthGuard>);
}
