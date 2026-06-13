import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

/**
 * Avvio prelievo: il diportista inserisce il codice stampato sotto il QR
 * della presa (il backend risolve POST /sessions { qr_code }).
 * Da smartphone può anche scansionare il QR con la fotocamera nativa:
 * il QR apre questa pagina con ?qr=<codice> precompilato.
 */
function Avvia() {
  const router = useRouter();
  const [qr, setQr] = useState((router.query.qr as string) ?? "");
  const [maxKwh, setMaxKwh] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/sessions", {
        qr_code: qr.trim(),
        max_kwh: maxKwh ? parseFloat(maxKwh) : null,
      });
      router.replace("/sessione");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Errore nell'avvio della sessione. Controlla il codice."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Avvia prelievo">
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Codice presa (sotto il QR sulla colonnina)
          </label>
          <input
            className="input font-mono uppercase"
            placeholder="es. GLEM-A03-P1"
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Limite kWh (opzionale)
          </label>
          <input
            className="input"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="es. 10 — vuoto = nessun limite"
            value={maxKwh}
            onChange={(e) => setMaxKwh(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading || !qr.trim()}>
          {loading ? "Avvio in corso…" : "⚡ Avvia prelievo"}
        </button>
        <p className="text-xs text-slate-400">
          Serve un saldo wallet minimo per iniziare. La presa si attiva entro
          pochi secondi dall'avvio.
        </p>
      </form>
    </Layout>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Avvia />
    </AuthGuard>
  );
}
