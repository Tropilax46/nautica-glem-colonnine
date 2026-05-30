import Layout from "../components/Layout";

export default function Impostazioni() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Impostazioni</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium">Tariffa di default (€/kWh)</label>
          <input className="border rounded p-2 w-32" defaultValue="0.55" />
        </div>
        <div>
          <label className="block text-sm font-medium">Soglia minima wallet per avvio sessione (€)</label>
          <input className="border rounded p-2 w-32" defaultValue="3.00" />
        </div>
        <div>
          <label className="block text-sm font-medium">Tagli ricarica disponibili (€)</label>
          <input className="border rounded p-2 w-64" defaultValue="10, 25, 50, 100" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email supporto</label>
          <input className="border rounded p-2 w-80" defaultValue="support@nauticaglem.it" />
        </div>

        <button className="bg-glem-500 text-white px-4 py-2 rounded">Salva</button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Le modifiche valgono per tutte le colonnine. Per impostare tariffe per singola colonnina vai in <em>Colonnine → Modifica</em>.
      </p>
    </Layout>
  );
}
