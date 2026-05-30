import useSWR from "swr";
import { useState } from "react";
import Layout from "../components/Layout";
import { api, fetcher } from "../lib/api";

type Utente = {
  id: string;
  nome: string;
  email: string;
  telefono: string;
  barca: string;
  saldo_eur: number;
  creato_il: string;
};

export default function Utenti() {
  const [q, setQ] = useState("");
  const { data, mutate } = useSWR<Utente[]>(`/admin/users?q=${encodeURIComponent(q)}`, fetcher);

  const accredita = async (u: Utente) => {
    const eur = parseFloat(prompt(`Quanti euro accreditare a ${u.nome}?`, "10") ?? "0");
    if (!eur || eur <= 0) return;
    const causale = prompt("Causale (es. 'rimborso')", "rimborso") ?? "";
    await api.post(`/admin/users/${u.id}/credit`, { amount_eur: eur, causale });
    mutate();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utenti</h1>
        <input
          className="border rounded p-2 w-64"
          placeholder="Cerca per nome, email, barca…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
              <th className="p-3"></th>
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
                <td className="p-3 text-right">
                  <button onClick={() => accredita(u)} className="text-glem-500 hover:underline text-xs">
                    + Accredita
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
