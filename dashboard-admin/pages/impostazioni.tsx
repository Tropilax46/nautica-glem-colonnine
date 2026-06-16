import useSWR from "swr";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api, fetcher } from "../lib/api";

export default function Impostazioni() {
  const { data, mutate } = useSWR<{ default_max_debito_eur: number }>("/admin/settings", fetcher);
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setVal(String(data.default_max_debito_eur)); }, [data]);

  const salva = async () => {
    setSaved(false);
    try { await api.post("/admin/settings/default-max-debito", { value: parseFloat(val) }); await mutate(); setSaved(true); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Impostazioni — Generali</h1>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium">Debito massimo predefinito (€)</label>
          <p className="mb-1 text-xs text-gray-500">Quanto un cliente può andare “in negativo” prima che la sessione si fermi. Sovrascrivibile per singolo cliente in Utenti.</p>
          <div className="flex items-center gap-2">
            <input className="border rounded p-2 w-full sm:w-32" type="number" min="0" step="0.5" value={val} onChange={(e) => { setVal(e.target.value); setSaved(false); }} />
            <button onClick={salva} className="bg-glem-500 text-white px-4 py-2 rounded">Salva</button>
            {saved && <span className="text-green-600 text-sm">✓ salvato</span>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm max-w-2xl mt-6 space-y-4 opacity-70">
        <p className="text-sm font-semibold text-gray-600">Altre impostazioni (in arrivo)</p>
        <div><label className="block text-sm">Tagli ricarica disponibili (€)</label><input className="border rounded p-2 w-full sm:w-64" defaultValue="10, 25, 50, 100" disabled /></div>
        <div><label className="block text-sm">Email supporto</label><input className="border rounded p-2 w-full sm:w-80" defaultValue="support@nauticaglem.it" disabled /></div>
      </div>
    </Layout>
  );
}
