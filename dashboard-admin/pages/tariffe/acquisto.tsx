import useSWR from "swr";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data } = await supabase.from("app_settings").select("costo_acq_elettricita_eur_kwh,costo_acq_acqua_eur_l").eq("id", 1).single();
  return data;
}

export default function TariffeAcquisto() {
  const { data, mutate } = useSWR("tariffe-acquisto", load);
  const [el, setEl] = useState(""); const [ac, setAc] = useState(""); const [ok, setOk] = useState(false);
  useEffect(() => { if (data) { setEl(String(n(data.costo_acq_elettricita_eur_kwh))); setAc(String((n(data.costo_acq_acqua_eur_l) * 1000).toFixed(2))); } }, [data]);
  const salva = async () => {
    setOk(false);
    const { error } = await supabase.from("app_settings").update({
      costo_acq_elettricita_eur_kwh: parseFloat(el) || 0,
      costo_acq_acqua_eur_l: (parseFloat(ac) || 0) / 1000,
    }).eq("id", 1);
    if (error) { alert(error.message); return; }
    setOk(true); mutate();
  };
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Tariffe d'acquisto</h1>
      <p className="text-gray-500 mb-6 text-sm">Quanto paghi tu il fornitore. Usate nel Rendiconto per calcolare i margini.</p>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm max-w-xl space-y-4">
        <div><label className="block text-sm font-medium">Costo acquisto elettricità (€/kWh)</label><input className="border rounded p-2 w-full sm:w-40" type="number" step="0.01" value={el} onChange={(e) => { setEl(e.target.value); setOk(false); }} /></div>
        <div><label className="block text-sm font-medium">Costo acquisto acqua (€/m³)</label><input className="border rounded p-2 w-full sm:w-40" type="number" step="0.1" value={ac} onChange={(e) => { setAc(e.target.value); setOk(false); }} /></div>
        <div className="flex items-center gap-2"><button onClick={salva} className="bg-glem-500 text-white px-4 py-2 rounded">Salva</button>{ok && <span className="text-green-600 text-sm">✓ salvato</span>}</div>
      </div>
    </Layout>
  );
}
