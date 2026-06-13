import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { api, fetcher, SessionOut } from "@/lib/api";

/** Sessione attiva: dati live via polling di GET /sessions/active ogni 5 s. */
function Sessione() {
  const { data: sessions, isLoading, mutate } = useSWR<SessionOut[]>(
    "/sessions/active",
    fetcher,
    { refreshInterval: 5000 }
  );
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sess = sessions?.[0];

  async function stop() {
    if (!sess) return;
    if (!confirm("Fermare il prelievo e scollegare la presa?")) return;
    setStopping(true);
    setError(null);
    try {
      await api.delete(`/sessions/${sess.id}`);
      await mutate();
    } catch {
      setError("Errore durante lo stop. Riprova.");
    } finally {
      setStopping(false);
    }
  }

  return (
    <Layout title="Sessione">
      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}

      {!isLoading && !sess && (
        <div className="card text-center">
          <p className="text-4xl">🔌</p>
          <p className="mt-2 font-semibold">Nessuna sessione attiva</p>
          <p className="mt-1 text-sm text-slate-500">
            Avvia un prelievo dalla colonnina per vedere qui i dati in tempo reale.
          </p>
          <Link
            href="/avvia"
            className="btn-primary mt-4 inline-block w-auto px-6 text-center"
          >
            ⚡ Avvia prelievo
          </Link>
        </div>
      )}

      {sess && (
        <div className="space-y-4">
          <div className="card text-center">
            <p className="text-sm text-slate-500">
              {sess.colonnina_id} · Presa {sess.presa_n}
            </p>
            <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {sess.status}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-sm text-slate-500">Energia</p>
              <p className="text-3xl font-bold text-glem-700">{sess.kwh.toFixed(2)}</p>
              <p className="text-sm text-slate-400">kWh</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-slate-500">Costo</p>
              <p className="text-3xl font-bold text-glem-700">{sess.cost_eur.toFixed(2)}</p>
              <p className="text-sm text-slate-400">€</p>
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button className="btn-danger" onClick={stop} disabled={stopping}>
            {stopping ? "Arresto in corso…" : "⏹ Ferma prelievo"}
          </button>
          <p className="text-center text-xs text-slate-400">
            Dati aggiornati automaticamente ogni 5 secondi.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Sessione />
    </AuthGuard>
  );
}
