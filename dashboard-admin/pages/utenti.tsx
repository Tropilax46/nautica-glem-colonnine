import useSWR from "swr";
import { useState } from "react";
import Layout from "../components/Layout";
import { api, fetcher, impersonate, CLIENT_URL } from "../lib/api";

type Utente = {
  id: string; nome: string; email: string; telefono: string;
  barca: string; saldo_eur: number; creato_il: string;
};

export default function Utenti() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, mutate } = useSWR<Utente[]>(`/admin/users?q=${encodeURIComponent(q)}`, fetcher);

  const accredita = async (u: Utente) => {
    const eur = parseFloat(prompt(`Quanti euro accreditare a ${u.nome}?`, "10") ?? "0");
    if (!eur || eur <= 0) return;
    try { await api.post(`/admin/users/${u.id}/credit`, { amount_eur: eur }); mutate(); }
    catch (e: any) { alert(e.message ?? "Errore"); }
  };

  const entraCome = async (u: Utente) => {
    setBusy(u.id);
    try {
      const { access_token, refresh_token } = await impersonate(u.id);
      const url = `${CLIENT_URL}/impersona#at=${encodeURIComponent(access_token)}&rt=${encodeURIComponent(refresh_token)}`;
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      alert("Impossibile entrare come utente: " + (e.message ?? "errore"));
    } finally { setBusy(null); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utenti</h1>
        <input className="border rounded p-2 w-64" placeholder="Cerca per nome, email, barca…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Contatti</th>
              <th className="p-3">Barca</th>
              <th className="p-3">Saldo</th>
              <th className="p-3">Iscritto</th>
              <th className="p-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.nome}</td>
                <td className="p-3">
                  <div>{u.email}</div>
                  <div className="text-gray-500 text-xs">{u.telefono}</div>
                </td>
                <td className="p-3">{u.barca || "—"}</td>
                <td className="p-3 font-mono">€ {u.saldo_eur.toFixed(2)}</td>
                <td className="p-3 text-gray-500">{new Date(u.creato_il).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => accredita(u)} className="text-glem-500 hover:underline text-xs">
                      + Accredita
                    </button>
                    <button onClick={() => entraCome(u)} disabled={busy === u.id}
                      className="rounded bg-glem-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-glem-700 disabled:opacity-50">
                      {busy === u.id ? "Apro…" : "Entra come utente ↗"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Nessun cliente trovato.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
