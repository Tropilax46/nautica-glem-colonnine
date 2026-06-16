import useSWR from "swr";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import { fetcher } from "../lib/api";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

type Stats = {
  colonnine_totali: number;
  colonnine_attive: number;
  utenti_totali: number;
  utenti_attivi_30d: number;
  kwh_oggi: number;
  ricavi_oggi_eur: number;
  ricavi_mese_eur: number;
  trend_30g: { giorno: string; kwh: number; eur: number }[];
};

export default function Dashboard() {
  const { data } = useSWR<Stats>("/admin/stats", fetcher, { refreshInterval: 30000 });

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Colonnine attive" value={`${data?.colonnine_attive ?? "—"}/${data?.colonnine_totali ?? "—"}`} />
        <KpiCard label="Utenti registrati" value={data?.utenti_totali ?? "—"} hint={`${data?.utenti_attivi_30d ?? "—"} attivi 30g`} />
        <KpiCard label="kWh oggi" value={data ? data.kwh_oggi.toFixed(1) : "—"} />
        <KpiCard label="Ricavi mese" value={data ? `€ ${data.ricavi_mese_eur.toFixed(0)}` : "—"} hint={data ? `oggi € ${data.ricavi_oggi_eur.toFixed(0)}` : ""} />
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Andamento ultimi 30 giorni</h2>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data?.trend_30g ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="giorno" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="kwh" stroke="#0b4f6c" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="eur" stroke="#2ecc71" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
