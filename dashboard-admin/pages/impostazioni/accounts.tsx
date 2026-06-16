import useSWR from "swr";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

async function load() {
  const { data, error } = await supabase.from("profiles")
    .select("id,full_name,email,role").in("role", ["admin", "operatore"]).order("role");
  if (error) throw error;
  return data ?? [];
}

export default function Accounts() {
  const { data } = useSWR("accounts", load);
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Gestione accounts</h1>
      <p className="text-gray-500 mb-6 text-sm">Account dello staff (amministratori e operatori) con accesso al pannello.</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Ruolo</th></tr>
          </thead>
          <tbody>
            {data?.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3"><span className="px-2 py-1 bg-glem-50 text-glem-700 rounded text-xs">{u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400">La creazione di nuovi account staff e la modifica dei ruoli verranno aggiunte qui (richiede operazione lato server con privilegi admin).</p>
    </Layout>
  );
}
