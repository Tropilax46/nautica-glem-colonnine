import useSWR from "swr";
import Layout from "../components/Layout";
import { supabase } from "../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id,colonnina_id,presa_n,started_at,potenza_kw,flusso_l_min,tariffa_eur_kwh,tariffa_acqua_eur_l,max_kwh,usa_elettricita,usa_acqua,profiles(full_name,email)")
    .eq("status", "in_carica").order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s: any) => {
    const hrs = (Date.now() - new Date(s.started_at).getTime()) / 3.6e6;
    let kwh = s.usa_elettricita ? Math.max(0, hrs * n(s.potenza_kw)) : 0;
    if (s.max_kwh != null) kwh = Math.min(kwh, n(s.max_kwh));
    const litri = s.usa_acqua ? Math.max(0, hrs * 60 * n(s.flusso_l_min)) : 0;
    return { id: s.id, colonnina: s.colonnina_id, presa: s.presa_n, utente: s.profiles?.full_name || s.profiles?.email || "—",
      start: s.started_at, kwh, litri, costo: kwh * n(s.tariffa_eur_kwh) + litri * n(s.tariffa_acqua_eur_l) };
  });
}

export default function SessioniAttive() {
  const { data, mutate } = useSWR("sessioni-attive", load, { refreshInterval: 5000 });
  const termina = async (id: string, utente: string) => {
    if (!confirm(`Terminare forzatamente la sessione di ${utente}?`)) return;
    const { error } = await supabase.rpc("stop_session", { p_session_id: id });
    if (error) { alert(error.message); return; }
    mutate();
  };
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Sessioni attive</h1>
      <p className="text-gray-500 mb-6 text-sm">Ricariche in corso, aggiornate ogni 5 secondi. Puoi interromperle forzatamente.</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Utente</th><th className="p-3">Colonnina</th><th className="p-3">Presa</th><th className="p-3">Inizio</th><th className="p-3">Consumi</th><th className="p-3">Costo</th><th className="p-3 text-right">Azioni</th></tr>
          </thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.utente}</td>
                <td className="p-3">{s.colonnina}</td>
                <td className="p-3">{s.presa}</td>
                <td className="p-3 text-gray-500">{new Date(s.start).toLocaleString()}</td>
                <td className="p-3 font-mono text-xs">{s.kwh.toFixed(2)} kWh{s.litri > 0 ? ` · ${s.litri.toFixed(0)} L` : ""}</td>
                <td className="p-3 font-mono">€ {s.costo.toFixed(2)}</td>
                <td className="p-3 text-right"><button onClick={() => termina(s.id, s.utente)} className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Termina</button></td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nessuna sessione attiva.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
