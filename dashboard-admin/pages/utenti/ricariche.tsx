import useSWR from "swr";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase.from("movimenti")
    .select("id,ts,type,delta_eur,note,profiles(full_name,email)")
    .in("type", ["topup", "admin_credit"]).order("ts", { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    id: m.id, ts: m.ts, tipo: m.type === "topup" ? "Wallet" : "Admin",
    utente: m.profiles?.full_name || m.profiles?.email || "—", importo: n(m.delta_eur), note: m.note,
  }));
}

export default function Ricariche() {
  const { data } = useSWR("ricariche", load, { refreshInterval: 20000 });
  const totale = (data ?? []).reduce((s, r) => s + r.importo, 0);
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Ricariche</h1>
      <p className="text-gray-500 mb-6 text-sm">Accrediti al wallet (ricariche utente + accrediti admin) · totale: <span className="font-semibold text-green-600">€ {totale.toFixed(2)}</span></p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Data</th><th className="p-3">Utente</th><th className="p-3">Tipo</th><th className="p-3 text-right">Importo</th></tr>
          </thead>
          <tbody>
            {data?.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-gray-500">{new Date(r.ts).toLocaleString()}</td>
                <td className="p-3 font-medium">{r.utente}</td>
                <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{r.tipo}</span></td>
                <td className="p-3 text-right font-mono text-green-600">+ € {r.importo.toFixed(2)}</td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nessuna ricarica registrata.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
