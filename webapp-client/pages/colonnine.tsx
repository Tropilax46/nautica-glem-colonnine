import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { ColonninaPublic, fetcher } from "@/lib/api";

function StatoPresa({ stato }: { stato: string }) {
  const map: Record<string, string> = { libera: "bg-green-100 text-green-700", occupata: "bg-amber-100 text-amber-700", fuori_servizio: "bg-red-100 text-red-700" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[stato] ?? "bg-slate-100"}`}>{stato.replace("_", " ")}</span>;
}

function Colonnine() {
  const { data, error, isLoading } = useSWR<ColonninaPublic[]>("/colonnine", fetcher, { refreshInterval: 10000 });
  const [q, setQ] = useState("");
  const filtered = (data ?? []).filter((c) => c.nome.toLowerCase().includes(q.toLowerCase()) || c.posto_barca.toLowerCase().includes(q.toLowerCase()));
  return (
    <Layout title="Colonnine">
      <input className="input mb-4" placeholder="Cerca colonnina o posto barca…" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <p className="text-center text-slate-400">Caricamento…</p>}
      {error && <p className="text-center text-red-600">Errore nel caricamento.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.nome}</p>
                <p className="text-sm text-slate-500">{c.posto_barca || "—"} · {c.tariffa_eur_kwh.toFixed(2)} €/kWh</p>
              </div>
              <span className={`h-3 w-3 rounded-full ${c.online ? "bg-green-500" : "bg-slate-300"}`} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {c.eroga_elettricita && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">⚡ luce</span>}
              {c.eroga_acqua && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">💧 acqua</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.prese.map((p) => (<div key={p.numero} className="flex items-center gap-1 text-sm"><span className="text-slate-500">Presa {p.numero}</span><StatoPresa stato={p.stato} /></div>))}
            </div>
            <Link href={`/avvia?c=${c.id}`} className="mt-3 block rounded-lg bg-glem-50 py-2 text-center text-sm font-semibold text-glem-700">Usa questa colonnina</Link>
          </div>
        ))}
      </div>
      {!isLoading && filtered.length === 0 && <p className="mt-4 text-center text-slate-400">Nessuna colonnina trovata.</p>}
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Colonnine /></AuthGuard>); }
