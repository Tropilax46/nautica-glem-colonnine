import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { api, getColonnina } from "@/lib/api";

const stripPresa = (s: string) => s.toUpperCase().trim().replace(/-P?\d+$/, "");

function Avvia() {
  const router = useRouter();
  const initial = ((router.query.c as string) || (router.query.qr as string) || "").toUpperCase();
  const [code, setCode] = useState(initial);
  const [col, setCol] = useState<any>(null);
  const [step, setStep] = useState<"cerca" | "conferma" | "servizi">(initial ? "conferma" : "cerca");
  const [usaE, setUsaE] = useState(true);
  const [usaA, setUsaA] = useState(false);
  const [maxKwh, setMaxKwh] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (initial) setCode(initial); }, [initial]);

  async function cerca(c: string) {
    setError(null);
    const id = stripPresa(c);
    if (!id) { setError("Inserisci un codice colonnina"); return; }
    try {
      const found = await getColonnina(id);
      if (!found) { setError("Colonnina non trovata: " + id); setCol(null); return; }
      if (!found.online) { setError("Colonnina fuori servizio"); }
      setCol(found);
      setUsaE(found.eroga_elettricita);
      setUsaA(false);
      setStep("conferma");
    } catch (e: any) { setError(e.message ?? "Errore"); }
  }

  // se arrivo dal QR con il codice in query, carico subito
  useEffect(() => { if (initial && !col) cerca(initial); /* eslint-disable-next-line */ }, [initial]);

  async function start() {
    if (!usaE && !usaA) { setError("Seleziona almeno un servizio"); return; }
    setLoading(true); setError(null);
    try {
      await api.post("/sessions", {
        qr_code: code || (col?.id ?? ""),
        max_kwh: usaE && maxKwh ? parseFloat(maxKwh) : null,
        usa_elettricita: usaE, usa_acqua: usaA,
      });
      router.replace("/sessione");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Errore nell'avvio della sessione");
      setLoading(false);
    }
  }

  return (
    <Layout title="Avvia prelievo">
      {step === "cerca" && (
        <form onSubmit={(e) => { e.preventDefault(); cerca(code); }} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Codice colonnina (sotto il QR)</label>
            <input className="input font-mono uppercase" placeholder="es. GLEM-A13"
              value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" disabled={!code.trim()}>Cerca colonnina</button>
          <p className="text-xs text-slate-400">Di solito basta inquadrare il QR sulla colonnina: ti porta qui già pronto.</p>
        </form>
      )}

      {step === "conferma" && col && (
        <div className="card space-y-4 text-center">
          <div className="text-4xl">⚓</div>
          <div>
            <p className="text-sm text-slate-500">Vuoi usare questa colonnina?</p>
            <h2 className="text-xl font-bold text-glem-700">{col.nome}</h2>
            <p className="text-sm text-slate-500">Posto barca {col.posto_barca || "—"}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {col.eroga_elettricita && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">⚡ {Number(col.tariffa_eur_kwh).toFixed(2)} €/kWh</span>}
            {col.eroga_acqua && <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">💧 {(Number(col.tariffa_acqua_eur_l) * 1000).toFixed(2)} €/m³</span>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <button onClick={() => setStep("servizi")} disabled={!col.online} className="btn-primary">
              Sì, usa questa colonnina
            </button>
            <button onClick={() => { setStep("cerca"); setCol(null); }} className="w-full rounded-xl py-2 text-sm text-slate-500">
              No, scegli un'altra
            </button>
          </div>
        </div>
      )}

      {step === "servizi" && col && (
        <div className="space-y-4">
          <div className="rounded-xl bg-glem-50 p-4 text-sm text-glem-700">
            🔌 <strong>Collega la presa e i tubi</strong> alla colonnina <strong>{col.nome}</strong>, poi seleziona cosa vuoi utilizzare.
          </div>

          <div className="card space-y-3">
            {col.eroga_elettricita && (
              <label className="flex items-center justify-between gap-3">
                <span><span className="font-medium">⚡ Elettricità</span><br /><span className="text-xs text-slate-500">{Number(col.tariffa_eur_kwh).toFixed(2)} €/kWh · {Number(col.potenza_kw).toFixed(1)} kW</span></span>
                <input type="checkbox" className="h-5 w-5 accent-glem-500" checked={usaE} onChange={(e) => setUsaE(e.target.checked)} />
              </label>
            )}
            {col.eroga_acqua && (
              <label className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span><span className="font-medium">💧 Acqua</span><br /><span className="text-xs text-slate-500">{(Number(col.tariffa_acqua_eur_l) * 1000).toFixed(2)} €/m³ · {Number(col.flusso_l_min).toFixed(0)} L/min</span></span>
                <input type="checkbox" className="h-5 w-5 accent-glem-500" checked={usaA} onChange={(e) => setUsaA(e.target.checked)} />
              </label>
            )}
          </div>

          {usaE && (
            <div className="card">
              <label className="mb-1 block text-sm font-medium text-slate-600">Limite kWh elettricità (opzionale)</label>
              <input className="input" type="number" min="0.5" step="0.5" placeholder="vuoto = nessun limite"
                value={maxKwh} onChange={(e) => setMaxKwh(e.target.value)} />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={start} disabled={loading || (!usaE && !usaA)} className="btn-primary">
            {loading ? "Avvio in corso…" : "Avvia prelievo"}
          </button>
          <button onClick={() => setStep("conferma")} className="w-full rounded-xl py-2 text-sm text-slate-500">Indietro</button>
          <p className="text-center text-xs text-slate-400">
            La sessione si ferma quando premi Termina, al raggiungimento del debito massimo o dopo 10 minuti di inattività.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default function Page() {
  return (<AuthGuard><Avvia /></AuthGuard>);
}
