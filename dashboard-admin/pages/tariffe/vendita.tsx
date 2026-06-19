import useSWR from "swr";
import { useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() {
  const { data, error } = await supabase.from("colonnine").select("id,nome,tariffa_eur_kwh,tariffa_acqua_eur_l,eroga_elettricita,eroga_acqua").order("id");
  if (error) throw error; return data ?? [];
}

function Riga({ c, onSaved }: { c: any; onSaved: () => void }) {
  const [kwh, setKwh] = useState(String(n(c.tariffa_eur_kwh)));
  const [acqua, setAcqua] = useState(String((n(c.tariffa_acqua_eur_l) * 1000).toFixed(2)));
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);
  const salva = async () => {
    setSaving(true); setOk(false);
    const { error } = await supabase.from("colonnine").update({
      tariffa_eur_kwh: parseFloat(kwh) || 0,
      tariffa_acqua_eur_l: (parseFloat(acqua) || 0) / 1000,
    }).eq("id", c.id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setOk(true); onSaved();
  };
  return (
    <tr className="border-t">
      <td className="p-2 font-mono">{c.id}</td>
      <td className="p-2">{c.nome}</td>
      <td className="p-2"><input className="w-24 border rounded p-1" type="number" step="0.01" value={kwh} onChange={(e) => { setKwh(e.target.value); setOk(false); }} disabled={!c.eroga_elettricita} /> <span className="text-xs text-gray-400">€/kWh</span></td>
      <td className="p-2"><input className="w-24 border rounded p-1" type="number" step="0.1" value={acqua} onChange={(e) => { setAcqua(e.target.value); setOk(false); }} disabled={!c.eroga_acqua} /> <span className="text-xs text-gray-400">€/m³</span></td>
      <td className="p-2 text-right"><button onClick={salva} disabled={saving} className="rounded bg-glem-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-glem-700 disabled:opacity-50">{saving ? "…" : ok ? "✓" : "Salva"}</button></td>
    </tr>
  );
}

export default function TariffeVendita() {
  const { data, mutate } = useSWR("tariffe-vendita", load);
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Tariffe di vendita</h1>
      <p className="text-gray-500 mb-6 text-sm">Prezzi applicati ai diportisti per ogni colonnina. L'acqua è in €/m³ (1000 litri).</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-2">ID</th><th className="p-2">Nome</th><th className="p-2">Elettricità</th><th className="p-2">Acqua</th><th className="p-2 text-right">Azioni</th></tr></thead>
          <tbody>{data?.map((c: any) => <Riga key={c.id} c={c} onSaved={() => mutate()} />)}</tbody>
        </table>
      </div>
    </Layout>
  );
}
