import useSWR from "swr";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import { supabase } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const [{ data: mov }, { data: ses }, { data: set }] = await Promise.all([
    supabase.from("movimenti").select("ts,type,delta_eur").eq("type", "charge"),
    supabase.from("sessions").select("colonnina_id,kwh,litri,cost_eur,status"),
    supabase.from("app_settings").select("costo_acq_elettricita_eur_kwh,costo_acq_acqua_eur_l").eq("id", 1).single(),
  ]);
  const charges = mov ?? [];
  const ricavi = charges.reduce((s, m) => s + Math.max(0, -n(m.delta_eur)), 0);
  const sessions = (ses ?? []).filter((s: any) => s.status === "terminata");
  const kwh = sessions.reduce((s, x: any) => s + n(x.kwh), 0);
  const litri = sessions.reduce((s, x: any) => s + n(x.litri), 0);
  const ce = n(set?.costo_acq_elettricita_eur_kwh), ca = n(set?.costo_acq_acqua_eur_l);
  const costoAcq = kwh * ce + litri * ca;
  const byMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); byMonth[d.toISOString().slice(0, 7)] = 0; }
  charges.forEach((m: any) => { const k = new Date(m.ts).toISOString().slice(0, 7); if (k in byMonth) byMonth[k] += Math.max(0, -n(m.delta_eur)); });
  const trend = Object.entries(byMonth).map(([mese, eur]) => ({ mese: mese.slice(5) + "/" + mese.slice(2, 4), eur: Math.round(eur * 100) / 100 }));
  const byCol: Record<string, any> = {};
  sessions.forEach((s: any) => { const c = s.colonnina_id; byCol[c] = byCol[c] || { kwh: 0, litri: 0, ricavi: 0 }; byCol[c].kwh += n(s.kwh); byCol[c].litri += n(s.litri); byCol[c].ricavi += n(s.cost_eur); });
  const perCol = Object.entries(byCol).map(([id, v]: any) => ({ id, ...v })).sort((a, b) => b.ricavi - a.ricavi);
  return { ricavi, kwh, litri, costoAcq, margine: ricavi - costoAcq, trend, perCol, hasAcq: ce > 0 || ca > 0 };
}

export default function Rendiconto() {
  const { data } = useSWR("rendiconto", load, { refreshInterval: 60000 });
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Rendiconto</h1>
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ricavi (vendita)" value={data ? `€ ${data.ricavi.toFixed(2)}` : "—"} />
        <KpiCard label="Costo acquisto" value={data ? `€ ${data.costoAcq.toFixed(2)}` : "—"} hint={data && !data.hasAcq ? "imposta le tariffe d'acquisto" : ""} />
        <KpiCard label="Margine" value={data ? `€ ${data.margine.toFixed(2)}` : "—"} />
        <KpiCard label="Erogato" value={data ? `${data.kwh.toFixed(1)} kWh` : "—"} hint={data ? `${data.litri.toFixed(0)} litri acqua` : ""} />
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="font-semibold mb-4">Fatturato — ultimi 12 mesi</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mese" /><YAxis /><Tooltip />
              <Bar dataKey="eur" name="€" fill="#0b4f6c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm overflow-x-auto">
        <h2 className="font-semibold mb-4">Dettaglio per colonnina</h2>
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="text-left text-gray-500"><th className="p-2">Colonnina</th><th className="p-2">kWh</th><th className="p-2">Litri</th><th className="p-2 text-right">Ricavi</th></tr></thead>
          <tbody>
            {data?.perCol.map((c: any) => (
              <tr key={c.id} className="border-t"><td className="p-2 font-mono">{c.id}</td><td className="p-2">{c.kwh.toFixed(1)}</td><td className="p-2">{c.litri.toFixed(0)}</td><td className="p-2 text-right font-mono">€ {c.ricavi.toFixed(2)}</td></tr>
            ))}
            {data && data.perCol.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nessun consumo registrato.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
