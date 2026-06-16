import useSWR from "swr";
import Layout from "../components/Layout";
import { supabase, CLIENT_URL } from "../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase.from("colonnine").select("*").order("id");
  if (error) throw error;
  return data ?? [];
}

export default function GestioneColonnine() {
  const { data } = useSWR("gestione-colonnine", load);
  const copia = (url: string) => { navigator.clipboard?.writeText(url); };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Gestione colonnine</h1>
        <button className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700 w-full sm:w-auto" disabled>+ Aggiungi colonnina</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">ID</th><th className="p-3">Nome</th><th className="p-3">Eroga</th>
              <th className="p-3">Tariffe</th><th className="p-3">Prese</th><th className="p-3">Stato</th><th className="p-3">Link QR</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c: any) => {
              const link = `${CLIENT_URL}/avvia?c=${c.id}`;
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-mono">{c.id}</td>
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3 whitespace-nowrap">
                    {c.eroga_elettricita && <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">⚡</span>}
                    {c.eroga_acqua && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">💧</span>}
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    {c.eroga_elettricita && <div>{n(c.tariffa_eur_kwh).toFixed(2)} €/kWh</div>}
                    {c.eroga_acqua && <div>{(n(c.tariffa_acqua_eur_l) * 1000).toFixed(2)} €/m³</div>}
                  </td>
                  <td className="p-3">{c.num_prese}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${c.online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.online ? "online" : "offline"}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <a href={link} target="_blank" rel="noreferrer" className="max-w-[180px] truncate text-xs text-glem-500 hover:underline">{link}</a>
                      <button onClick={() => copia(link)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Copia</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">Stampa il QR code che punta al “Link QR” di ogni colonnina: chi lo inquadra entra nel flusso di avvio già sulla colonnina giusta.</p>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Struttura impianto</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: "Porti", d: "Sedi/marine gestite" },
          { t: "Zone", d: "Aree all'interno di un porto" },
          { t: "Sezioni / Pontili", d: "Suddivisione delle zone" },
          { t: "Tipologie colonnine", d: "Modelli con n° prese e potenze" },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-5 text-center">
            <p className="font-medium">{x.t}</p>
            <p className="mt-1 text-xs text-gray-500">{x.d}</p>
            <p className="mt-3 text-xs text-gray-400">🚧 da attivare</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
