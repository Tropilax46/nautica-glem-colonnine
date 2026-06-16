import useSWR from "swr";
import Layout from "../components/Layout";
import { fetcher } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

type ReportMese = { mese: string; kwh: number; eur: number; utenti_attivi: number };

export default function Report() {
  const { data } = useSWR<ReportMese[]>("/admin/stats?period=12m", fetcher);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Report consumi</h1>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="font-semibold mb-4">Energia erogata e ricavi — ultimi 12 mesi</h2>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mese" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="kwh" name="kWh" fill="#0b4f6c" />
              <Bar dataKey="eur" name="€" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm overflow-x-auto">
        <h2 className="font-semibold mb-4">Tabella mensile</h2>
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">Mese</th><th className="p-2">kWh erogati</th>
              <th className="p-2">Ricavi</th><th className="p-2">Utenti attivi</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((r) => (
              <tr key={r.mese} className="border-t">
                <td className="p-2">{r.mese}</td>
                <td className="p-2">{r.kwh.toFixed(1)}</td>
                <td className="p-2">€ {r.eur.toFixed(2)}</td>
                <td className="p-2">{r.utenti_attivi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
