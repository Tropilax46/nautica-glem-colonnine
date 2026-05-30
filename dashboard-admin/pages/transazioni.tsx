import useSWR from "swr";
import Layout from "../components/Layout";
import { api, fetcher } from "../lib/api";
import { useState } from "react";

type Tx = {
  id: string;
  created_at: string;
  user_email: string;
  type: "TOPUP" | "ENERGY" | "REFUND" | "ADJUST";
  kwh: number | null;
  delta_eur: number;
  colonnina_id: string | null;
  session_id: string | null;
};

export default function Transazioni() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const url = `/admin/transactions?from=${from}&to=${to}`;
  const { data } = useSWR<Tx[]>(url, fetcher);

  const exportCsv = async () => {
    const res = await api.get(url + "&format=csv", { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = `transazioni_${from || "all"}_${to || "all"}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transazioni</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded p-2" />
          <span>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded p-2" />
          <button onClick={exportCsv} className="bg-glem-500 text-white px-4 py-2 rounded">
            Esporta CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Utente</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">kWh</th>
              <th className="p-3 text-right">Importo</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-3">{t.user_email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">{t.type}</span>
                </td>
                <td className="p-3">{t.kwh != null ? t.kwh.toFixed(2) : "—"}</td>
                <td className={`p-3 text-right font-mono ${t.delta_eur > 0 ? "text-green-600" : "text-gray-800"}`}>
                  {t.delta_eur > 0 ? "+" : ""}{t.delta_eur.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
