import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { ColonninaPublic, fetcher, UserOut, SessionOut } from "@/lib/api";

function StatoPresa({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    libera: "bg-green-100 text-green-700",
    occupata: "bg-amber-100 text-amber-700",
    fuori_servizio: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[stato] ?? "bg-slate-100"}`}>{stato.replace("_", " ")}</span>;
}

function Home() {
  const { data: me } = useSWR<UserOut>("/users/me", fetcher);
  const { data: active } = useSWR<SessionOut[]>("/sessions/active", fetcher, { refreshInterval: 5000 });
  const { data: colonnine, error, isLoading } = useSWR<ColonninaPublic[]>("/colonnine", fetcher, { refreshInterval: 10000 });
  const [q, setQ] = useState("");
  const sess = active?.[0];

  const filtered = (colonnine ?? []).filter(
    (c) => c.nome.toLowerCase().includes(q.toLowerCase()) || c.posto_barca.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout title="Colonnine">
      {/* Sessione in corso */}
      {sess && (
        <Link href="/sessione" className="mb-4 block">
          <div className="card border-2 border-green-300 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">● Sessione in corso · {sess.colonnina_id}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {sess.usa_elettricita && <>{sess.kwh.toFixed(2)} kWh </>}
                  {sess.usa_acqua && <>{sess.litri.toFixed(0)} L </>}
                  · <strong>{sess.costo_totale.toFixed(2)} €</strong>
                </p>
              </div>
              <span className="text-glem-700 font-semibold">Apri →</span>
            </div>
          </div>
        </Link>
      )}

      {/* Saldo + CTA */}
      <div className="card mb-4 flex items-center justify-between bg-glem-500 text-white">
        <div>
          <p className="text-sm opacity-80">Saldo wallet</p>
          <p className="text-2xl font-bold">{me ? `${me.wallet_eur.toFixed(2)} €` : "—"}</p>
        </div>
        <Link href="/avvia" className="rounded-xl bg-white px-4 py-2.5 font-semibold text-glem-700 active:scale-95">⚡ Avvia prelievo</Link>
      </div>

      <input className="input mb-4" placeholder="Cerca colonnina o posto barca…" value={q} onChange={(e) => setQ(e.target.value)} />

      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}
      {error && <p className="text-center text-red-600">Impossibile caricare le colonnine. Riprova.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.nome}</p>
                <p className="text-sm text-slate-500">{c.posto_barca || "—"} · {c.tariffa_eur_kwh.toFixed(2)} €/kWh</p>
              </div>
              <span className={`h-3 w-3 rounded-full ${c.online ? "bg-green-500" : "bg-slate-300"}`} title={c.online ? "online" : "offline"} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {c.eroga_elettricita && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">⚡ luce</span>}
              {c.eroga_acqua && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">💧 acqua</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.prese.map((p) => (
                <div key={p.numero} className="flex items-center gap-1 text-sm">
                  <span className="text-slate-500">Presa {p.numero}</span>
                  <StatoPresa stato={p.stato} />
                </div>
              ))}
            </div>
            <Link href={`/avvia?c=${c.id}`} className="mt-3 block rounded-lg bg-glem-50 py-2 text-center text-sm font-semibold text-glem-700">
              Usa questa colonnina
            </Link>
          </div>
        ))}
      </div>

      {!isLoading && !error && filtered.length === 0 && (
        <p className="mt-4 text-center text-slate-400">Nessuna colonnina trovata.</p>
      )}
    </Layout>
  );
}

export default function Page() {
  return (<AuthGuard><Home /></AuthGuard>);
}
