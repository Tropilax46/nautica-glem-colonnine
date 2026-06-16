import useSWR from "swr";
import Layout from "../../components/Layout";
import { api, supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase.from("profiles")
    .select("id,full_name,email,wallet_eur").lt("wallet_eur", 0).order("wallet_eur", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((u: any) => ({ ...u, wallet_eur: n(u.wallet_eur) }));
}

export default function Debiti() {
  const { data, mutate } = useSWR("debiti", load, { refreshInterval: 15000 });
  const totale = (data ?? []).reduce((s, u) => s + u.wallet_eur, 0);
  const salda = async (u: any) => {
    const eur = Math.abs(u.wallet_eur);
    if (!confirm(`Accreditare € ${eur.toFixed(2)} a ${u.full_name ?? u.email} per azzerare il debito?`)) return;
    try { await api.post(`/admin/users/${u.id}/credit`, { amount_eur: eur }); mutate(); }
    catch (e: any) { alert(e.message ?? "Errore"); }
  };
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Debiti</h1>
      <p className="text-gray-500 mb-6 text-sm">Utenti con saldo wallet negativo · totale esposizione: <span className="font-semibold text-red-600">€ {totale.toFixed(2)}</span></p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Utente</th><th className="p-3">Email</th><th className="p-3">Saldo</th><th className="p-3 text-right">Azioni</th></tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 font-mono text-red-600">€ {u.wallet_eur.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => salda(u)} className="rounded bg-glem-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-glem-700">Salda debito</button>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nessun utente in debito. 👍</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
