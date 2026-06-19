import useSWR from "swr";
import { useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function load() { const { data, error } = await supabase.from("gruppi_utenti").select("*").order("nome"); if (error) throw error; return data ?? []; }

export default function Gruppi() {
  const { data, mutate } = useSWR("gruppi", load);
  const [f, setF] = useState<any>(null);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const salva = async () => {
    if (!f.nome?.trim()) { alert("Nome obbligatorio"); return; }
    const payload: any = {
      nome: f.nome, descrizione: f.descrizione || null,
      sconto_perc: parseFloat(f.sconto_perc) || 0,
      prezzo_elettricita_eur_kwh: f.prezzo_e === "" || f.prezzo_e == null ? null : parseFloat(f.prezzo_e),
      prezzo_acqua_eur_l: f.prezzo_a === "" || f.prezzo_a == null ? null : (parseFloat(f.prezzo_a) / 1000),
    };
    const res = f.id ? await supabase.from("gruppi_utenti").update(payload).eq("id", f.id) : await supabase.from("gruppi_utenti").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setF(null); mutate();
  };
  const apri = (g: any) => setF({ id: g?.id, nome: g?.nome ?? "", descrizione: g?.descrizione ?? "", sconto_perc: g ? String(n(g.sconto_perc)) : "0",
    prezzo_e: g?.prezzo_elettricita_eur_kwh != null ? String(n(g.prezzo_elettricita_eur_kwh)) : "",
    prezzo_a: g?.prezzo_acqua_eur_l != null ? String((n(g.prezzo_acqua_eur_l) * 1000).toFixed(2)) : "" });
  const elimina = async (g: any) => { if (!confirm(`Eliminare il gruppo "${g.nome}"?`)) return; const { error } = await supabase.from("gruppi_utenti").delete().eq("id", g.id); if (error) { alert(error.message); return; } mutate(); };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Gruppi utenti</h1>
        <button onClick={() => apri(null)} className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700 w-full sm:w-auto">+ Nuovo gruppo</button>
      </div>
      <p className="text-gray-500 mb-6 text-sm">Imposta uno <strong>sconto %</strong> sulle tariffe standard, oppure un <strong>prezzo riservato</strong> (sovrascrive lo sconto). Si applica automaticamente alle sessioni dei membri del gruppo.</p>

      {f && (
        <div className="mb-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm space-y-3">
          <p className="font-semibold">{f.id ? "Modifica gruppo" : "Nuovo gruppo"}</p>
          <input className="w-full border rounded p-2" placeholder="Nome gruppo *" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          <input className="w-full border rounded p-2" placeholder="Descrizione" value={f.descrizione ?? ""} onChange={(e) => set("descrizione", e.target.value)} />
          <div>
            <label className="block text-sm font-medium">Sconto %</label>
            <input className="w-full sm:w-32 border rounded p-2" type="number" step="1" min="0" max="100" value={f.sconto_perc} onChange={(e) => set("sconto_perc", e.target.value)} />
          </div>
          <div className="rounded-lg bg-slate-50 p-3 space-y-2">
            <p className="text-xs text-gray-500">Prezzi riservati (opzionali, sovrascrivono lo sconto):</p>
            <div className="flex flex-wrap gap-3">
              <div><label className="block text-xs">Elettricità €/kWh</label><input className="w-32 border rounded p-2" type="number" step="0.01" placeholder="standard" value={f.prezzo_e} onChange={(e) => set("prezzo_e", e.target.value)} /></div>
              <div><label className="block text-xs">Acqua €/m³</label><input className="w-32 border rounded p-2" type="number" step="0.1" placeholder="standard" value={f.prezzo_a} onChange={(e) => set("prezzo_a", e.target.value)} /></div>
            </div>
          </div>
          <div className="flex gap-2"><button onClick={salva} className="rounded bg-glem-500 px-4 py-2 text-white">Salva</button><button onClick={() => setF(null)} className="rounded px-4 py-2 text-slate-500">Annulla</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Nome</th><th className="p-3">Sconto</th><th className="p-3">Prezzi riservati</th><th className="p-3 text-right">Azioni</th></tr></thead>
          <tbody>
            {data?.map((g: any) => (
              <tr key={g.id} className="border-t">
                <td className="p-3"><div className="font-medium">{g.nome}</div><div className="text-xs text-gray-500">{g.descrizione}</div></td>
                <td className="p-3">{n(g.sconto_perc) > 0 ? `−${n(g.sconto_perc)}%` : "—"}</td>
                <td className="p-3 text-xs text-gray-600">{g.prezzo_elettricita_eur_kwh != null ? `${n(g.prezzo_elettricita_eur_kwh).toFixed(2)} €/kWh` : ""}{g.prezzo_acqua_eur_l != null ? ` ${(n(g.prezzo_acqua_eur_l) * 1000).toFixed(2)} €/m³` : ""}{g.prezzo_elettricita_eur_kwh == null && g.prezzo_acqua_eur_l == null ? "—" : ""}</td>
                <td className="p-3 text-right"><div className="flex justify-end gap-3"><button onClick={() => apri(g)} className="text-glem-500 hover:underline text-xs">Modifica</button><button onClick={() => elimina(g)} className="text-red-600 hover:underline text-xs">Elimina</button></div></td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nessun gruppo creato.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
