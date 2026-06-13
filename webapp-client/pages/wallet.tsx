import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { api, fetcher, WalletOut } from "@/lib/api";

const IMPORTI = [10, 20, 50, 100];

function Wallet() {
  const router = useRouter();
  const ricaricaOk = router.query.topup === "ok";
  const { data, isLoading } = useSWR<WalletOut>("/wallet", fetcher);
  const [amount, setAmount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ricarica() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.post("/wallet/topup", { amount_eur: amount });
      // Redirect a Stripe Checkout (in demo torna subito qui con ?topup=ok)
      window.location.href = r.data.checkout_url;
    } catch {
      setError("Errore nella creazione del pagamento. Riprova.");
      setLoading(false);
    }
  }

  return (
    <Layout title="Wallet">
      {ricaricaOk && (
        <div className="card mb-4 bg-green-50 text-center text-sm font-medium text-green-700">
          ✅ Ricarica completata. Saldo aggiornato.
        </div>
      )}
      <div className="card mb-4 bg-glem-500 text-center text-white">
        <p className="text-sm opacity-80">Saldo disponibile</p>
        <p className="text-4xl font-bold">
          {data ? `${data.saldo_eur.toFixed(2)} €` : "—"}
        </p>
      </div>

      <div className="card mb-4">
        <p className="mb-3 font-semibold">Ricarica wallet</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {IMPORTI.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`rounded-xl border py-2 font-semibold ${
                amount === v
                  ? "border-glem-500 bg-glem-50 text-glem-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {v} €
            </button>
          ))}
        </div>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary" onClick={ricarica} disabled={loading}>
          {loading ? "Apro il pagamento…" : `Ricarica ${amount} € con carta`}
        </button>
        <p className="mt-2 text-xs text-slate-400">
          Pagamento sicuro via Stripe. Al termine torni automaticamente qui.
        </p>
      </div>

      <p className="mb-2 font-semibold">Movimenti recenti</p>
      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}
      <div className="space-y-2">
        {data?.movimenti.map((m, i) => (
          <div key={i} className="card flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">
                {m.type === "topup" ? "Ricarica" : m.type === "charge" ? "Prelievo energia" : m.type}
                {m.kwh > 0 && ` · ${m.kwh.toFixed(2)} kWh`}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(m.ts).toLocaleString("it-IT")}
                {m.note ? ` · ${m.note}` : ""}
              </p>
            </div>
            <p className={`font-bold ${m.delta_eur >= 0 ? "text-green-600" : "text-slate-700"}`}>
              {m.delta_eur >= 0 ? "+" : ""}
              {m.delta_eur.toFixed(2)} €
            </p>
          </div>
        ))}
        {!isLoading && (!data || data.movimenti.length === 0) && (
          <p className="text-center text-slate-400">Nessun movimento.</p>
        )}
      </div>
    </Layout>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Wallet />
    </AuthGuard>
  );
}
