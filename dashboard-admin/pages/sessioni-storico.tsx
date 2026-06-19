import useSWR from "swr";
import Layout from "../components/Layout";
import { supabase } from "../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id,colonnina_id,presa_n,kwh,litri,cost_eur,usa_elettricita,usa_acqua,status,started_at,ended_at,profiles(full_name,email)")
    .order("started_at", { ascending: false }).limit(500);
  if (error) throw error; return data ?? [];
}

export default function SessioniStorico() {
  const { data } = useSWR("sessioni-storico", load, { refreshInterval: 30000 });
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Storico sessioni</h1>
      <p className="text-gray-500 mb-6 text-sm">Cronologia completa di tutte le sessioni di tutti i clienti.</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Data</th><th className="p-3">Utente</th><th className="p-3">Colonnina</th><th className="p-3">Servizi</th><th className="p-3">Consumi</th><th className="p-3">Costo</th><th className="p-3">Stato</th></tr>
          </thead>
          <tbody>
            {data?.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 text-gray-500">{new Date(s.started_at).toLocaleString()}</td>
                <td className="p-3 font-medium">{s.profiles?.full_name || s.profiles?.email || "—"}</td>
                <td className="p-3">{s.colonnina_id} · P{s.presa_n}</td>
                <td className="p-3 whitespace-nowrap">{s.usa_elettricita && "⚡"}{s.usa_acqua && "💧"}</td>
                <td className="p-3 font-mono text-xs">{n(s.kwh).toFixed(2)} kWh{n(s.litri) > 0 ? ` · ${n(s.litri).toFixed(0)} L` : ""}</td>
                <td className="p-3 font-mono">€ {n(s.cost_eur).toFixed(2)}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "in_carica" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.status === "in_carica" ? "in corso" : "terminata"}</span></td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nessuna sessione.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
