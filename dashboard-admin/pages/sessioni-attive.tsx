import useSWR from "swr";
import Layout from "../components/Layout";
import { supabase } from "../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));

async function load() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id,colonnina_id,presa_n,started_at,potenza_kw,tariffa_eur_kwh,max_kwh,profiles(full_name,email)")
    .eq("status", "in_carica")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s: any) => {
    const hrs = (Date.now() - new Date(s.started_at).getTime()) / 3.6e6;
    let kwh = Math.max(0, hrs * n(s.potenza_kw));
    if (s.max_kwh != null) kwh = Math.min(kwh, n(s.max_kwh));
    return {
      id: s.id, colonnina: s.colonnina_id, presa: s.presa_n,
      utente: s.profiles?.full_name || s.profiles?.email || "—",
      start: s.started_at, kwh, costo: kwh * n(s.tariffa_eur_kwh),
    };
  });
}

export default function SessioniAttive() {
  const { data } = useSWR("sessioni-attive", load, { refreshInterval: 5000 });
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Sessioni attive</h1>
      <p className="text-gray-500 mb-6 text-sm">Ricariche in corso, aggiornate ogni 5 secondi.</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Utente</th><th className="p-3">Colonnina</th><th className="p-3">Presa</th>
              <th className="p-3">Inizio</th><th className="p-3">kWh</th><th className="p-3 text-right">Costo</th></tr>
          </thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.utente}</td>
                <td className="p-3">{s.colonnina}</td>
                <td className="p-3">{s.presa}</td>
                <td className="p-3 text-gray-500">{new Date(s.start).toLocaleString()}</td>
                <td className="p-3 font-mono">{s.kwh.toFixed(2)}</td>
                <td className="p-3 text-right font-mono">€ {s.costo.toFixed(2)}</td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Nessuna sessione attiva al momento.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
