import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { ColonninaPublic, fetcher, UserOut } from "@/lib/api";

function StatoPresa({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    libera: "bg-green-100 text-green-700",
    occupata: "bg-amber-100 text-amber-700",
    fuori_servizio: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[stato] ?? "bg-slate-100"}`}>
      {stato.replace("_", " ")}
    </span>
  );
}

function Home() {
  const { data: me } = useSWR<UserOut>("/users/me", fetcher);
  const { data: colonnine, error, isLoading } = useSWR<ColonninaPublic[]>("/colonnine", fetcher, {
    refreshInterval: 10000,
  });
  const [q, setQ] = useState("");

  const filtered = (colonnine ?? []).filter(
    (c) =>
      c.nome.toLowerCase().includes(q.toLowerCase()) ||
      c.posto_barca.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout title="Colonnine">
      {/* Saldo + CTA avvio */}
      <div className="card mb-4 flex items-center justify-between bg-glem-500 text-white">
        <div>
          <p className="text-sm opacity-80">Saldo wallet</p>
          <p className="text-2xl font-bold">
            {me ? `${me.wallet_eur.toFixed(2)} €` : "—"}
          </p>
        </div>
        <Link
          href="/avvia"
          className="rounded-xl bg-white px-4 py-2.5 font-semibold text-glem-700 active:scale-95"
        >
          ⚡ Avvia prelievo
        </Link>
      </div>

      <input
        className="input mb-4"
        placeholder="Cerca colonnina o posto barca…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}
      {error && (
        <p className="text-center text-red-600">
          Impossibile contattare il backend. Verifica che sia avviato.
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.nome}</p>
                <p className="text-sm text-slate-500">
                  {c.posto_barca || "—"} · {c.tariffa_eur_kwh.toFixed(2)} €/kWh
                </p>
              </div>
              <span
                className={`h-3 w-3 rounded-full ${c.online ? "bg-green-500" : "bg-slate-300"}`}
                title={c.online ? "online" : "offline"}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.prese.map((p) => (
                <div key={p.numero} className="flex items-center gap-1 text-sm">
                  <span className="text-slate-500">Presa {p.numero}</span>
                  <StatoPresa stato={p.stato} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="text-center text-slate-400">Nessuna colonnina trovata.</p>
        )}
      </div>
    </Layout>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Home />
    </AuthGuard>
  );
}
