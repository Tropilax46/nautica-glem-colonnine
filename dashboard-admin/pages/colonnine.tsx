import useSWR from "swr";
import Layout from "../components/Layout";
import { api, fetcher } from "../lib/api";

type Colonnina = {
  id: string;
  nome: string;
  posto_barca: string;
  online: boolean;
  ultima_telemetria: string | null;
  prese: { numero: number; stato: string; sessione_id: string | null; kwh_correnti: number }[];
};

export default function Colonnine() {
  const { data, mutate } = useSWR<Colonnina[]>("/admin/colonnine", fetcher, { refreshInterval: 5000 });

  const forzaOff = async (id: string) => {
    if (!confirm("Forzare lo spegnimento di tutte le prese?")) return;
    await api.post(`/admin/colonnine/${id}/force-off`);
    mutate();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Colonnine</h1>
        <button className="bg-glem-500 text-white px-4 py-2 rounded hover:bg-glem-700">+ Aggiungi</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Posto barca</th>
              <th className="p-3">Stato</th>
              <th className="p-3">Prese attive</th>
              <th className="p-3">Ultima telemetria</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => {
              const attive = c.prese.filter((p) => p.stato === "occupata").length;
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3">{c.posto_barca}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${c.online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.online ? "online" : "offline"}
                    </span>
                  </td>
                  <td className="p-3">{attive}/{c.prese.length}</td>
                  <td className="p-3 text-gray-500">{c.ultima_telemetria ? new Date(c.ultima_telemetria).toLocaleString() : "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => forzaOff(c.id)} className="text-red-600 hover:underline text-xs">
                      Force OFF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
