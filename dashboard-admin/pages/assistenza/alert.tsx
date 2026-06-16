import useSWR from "swr";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const [{ data: cols }, { data: deb }] = await Promise.all([
    supabase.from("colonnine").select("id,nome,online").eq("online", false),
    supabase.from("profiles").select("id,full_name,email,wallet_eur").lt("wallet_eur", 0),
  ]);
  const alerts: { sev: string; titolo: string; dettaglio: string }[] = [];
  (cols ?? []).forEach((c: any) => alerts.push({ sev: "alta", titolo: `Colonnina offline: ${c.nome}`, dettaglio: `${c.id} non risponde / fuori servizio` }));
  (deb ?? []).forEach((u: any) => alerts.push({ sev: "media", titolo: `Saldo negativo: ${u.full_name ?? u.email}`, dettaglio: `Wallet € ${n(u.wallet_eur).toFixed(2)}` }));
  return alerts;
}
const sevCls: Record<string, string> = { alta: "bg-red-100 text-red-700", media: "bg-amber-100 text-amber-700", bassa: "bg-slate-100 text-slate-600" };

export default function Alert() {
  const { data } = useSWR("alert", load, { refreshInterval: 15000 });
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Alert</h1>
      <p className="text-gray-500 mb-6 text-sm">Anomalie rilevate automaticamente (colonnine offline, saldi negativi).</p>
      <div className="space-y-2">
        {data?.map((a, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium">{a.titolo}</p>
              <p className="text-sm text-gray-500">{a.dettaglio}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${sevCls[a.sev]}`}>{a.sev}</span>
          </div>
        ))}
        {data && data.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">Nessun alert attivo. Tutto regolare. ✅</div>
        )}
      </div>
    </Layout>
  );
}
