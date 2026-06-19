import useSWR from "swr";
import { useState } from "react";
import Layout from "../../components/Layout";
import { api, supabase } from "../../lib/api";

const RUOLI = ["diportista", "operatore", "admin"];
async function load() {
  const { data, error } = await supabase.from("profiles").select("id,full_name,email,role").in("role", ["admin", "operatore"]).order("role");
  if (error) throw error; return data ?? [];
}

export default function Accounts() {
  const { data, mutate } = useSWR("accounts", load);
  const [email, setEmail] = useState(""); const [ruolo, setRuolo] = useState("operatore");

  const cambiaRuolo = async (id: string, r: string) => {
    try { await api.post(`/admin/users/${id}/ruolo`, { ruolo: r }); mutate(); } catch (e: any) { alert(e.message); }
  };
  const assegna = async () => {
    if (!email.trim()) return;
    const { data: u, error } = await supabase.from("profiles").select("id,email").ilike("email", email.trim()).maybeSingle();
    if (error) { alert(error.message); return; }
    if (!u) { alert("Nessun utente registrato con questa email. L'utente deve prima registrarsi nell'app."); return; }
    try { await api.post(`/admin/users/${u.id}/ruolo`, { ruolo }); setEmail(""); mutate(); alert(`Ruolo "${ruolo}" assegnato a ${u.email}.`); } catch (e: any) { alert(e.message); }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Gestione accounts</h1>
      <p className="text-gray-500 mb-6 text-sm">Account dello staff con accesso al pannello. Modifica i ruoli o assegna un ruolo a un utente registrato.</p>

      <div className="mb-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <p className="font-semibold mb-3">Assegna ruolo a un utente</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]"><label className="block text-xs text-gray-500">Email utente (già registrato)</label><input className="w-full border rounded p-2" placeholder="email@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500">Ruolo</label><select className="border rounded p-2" value={ruolo} onChange={(e) => setRuolo(e.target.value)}>{RUOLI.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
          <button onClick={assegna} className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700">Assegna</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Ruolo</th></tr></thead>
          <tbody>
            {data?.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select className="border rounded p-1" value={u.role} onChange={(e) => cambiaRuolo(u.id, e.target.value)}>{RUOLI.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400">Nessun account staff.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">Impostando il ruolo su “diportista” l'utente viene rimosso dallo staff. La creazione di account ex-novo (con invito email) verrà aggiunta in seguito.</p>
    </Layout>
  );
}
