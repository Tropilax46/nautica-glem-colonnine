import useSWR from "swr";
import Layout from "../components/Layout";
import { fetcher } from "../lib/api";
import { useState } from "react";

type Tx = { id: string; created_at: string; user_email: string; type: string; kwh: number | null; delta_eur: number };

export default function Transazioni() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const url = `/admin/transactions?from=${from}&to=${to}`;
  const { data } = useSWR<Tx[]>(url, fetcher);

  const exportCsv = () => {
    const rows = data ?? [];
    const head = ["data", "utente", "tipo", "kwh", "importo_eur"];
    const lines = rows.map((t) => [
      new Date(t.created_at).toISOString(), t.user_email, t.type,
      t.kwh != null ? t.kwh.toFixed(2) : "", t.delta_eur.toFixed(2),
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transazioni_${from || "all"}_${to || "all"}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Transazioni</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded p-2" />
          <span>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded p-2" />
          <button onClick={exportCsv} className="bg-glem-500 text-white px-4 py-2 rounded">Esporta CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Data</th><th className="p-3">Utente</th><th className="p-3">Tipo</th>
              <th className="p-3">kWh</th><th className="p-3 text-right">Importo</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-3">{t.user_email}</td>
                <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{t.type}</span></td>
                <td className="p-3">{t.kwh != null ? t.kwh.toFixed(2) : "—"}</td>
                <td className={`p-3 text-right font-mono ${t.delta_eur > 0 ? "text-green-600" : "text-gray-800"}`}>
                  {t.delta_eur > 0 ? "+" : ""}{t.delta_eur.toFixed(2)} €
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nessuna transazione nel periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
