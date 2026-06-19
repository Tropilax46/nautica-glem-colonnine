import useSWR from "swr";
import { useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

async function load() { const { data, error } = await supabase.from("gruppi_utenti").select("*").order("nome"); if (error) throw error; return data ?? []; }

export default function Gruppi() {
  const { data, mutate } = useSWR("gruppi", load);
  const [f, setF] = useState<any>(null);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const salva = async () => {
    if (!f.nome?.trim()) { alert("Nome obbligatorio"); return; }
    const payload = { nome: f.nome, descrizione: f.descrizione || null };
    const res = f.id ? await supabase.from("gruppi_utenti").update(payload).eq("id", f.id) : await supabase.from("gruppi_utenti").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setF(null); mutate();
  };
  const elimina = async (g: any) => { if (!confirm(`Eliminare il gruppo "${g.nome}"?`)) return; const { error } = await supabase.from("gruppi_utenti").delete().eq("id", g.id); if (error) { alert(error.message); return; } mutate(); };
  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Gruppi utenti</h1>
        <button onClick={() => setF({ nome: "", descrizione: "" })} className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700 w-full sm:w-auto">+ Nuovo gruppo</button>
      </div>
      <p className="text-gray-500 mb-6 text-sm">Crea gruppi (es. residenti, transito, charter). Assegnazione utenti e tariffe/sconti per gruppo: prossimo step.</p>
      {f && (
        <div className="mb-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm space-y-3">
          <input className="w-full border rounded p-2" placeholder="Nome gruppo *" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          <input className="w-full border rounded p-2" placeholder="Descrizione" value={f.descrizione ?? ""} onChange={(e) => set("descrizione", e.target.value)} />
          <div className="flex gap-2"><button onClick={salva} className="rounded bg-glem-500 px-4 py-2 text-white">Salva</button><button onClick={() => setF(null)} className="rounded px-4 py-2 text-slate-500">Annulla</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Nome</th><th className="p-3">Descrizione</th><th className="p-3 text-right">Azioni</th></tr></thead>
          <tbody>
            {data?.map((g: any) => (
              <tr key={g.id} className="border-t"><td className="p-3 font-medium">{g.nome}</td><td className="p-3 text-gray-500">{g.descrizione || "—"}</td><td className="p-3 text-right"><div className="flex justify-end gap-3"><button onClick={() => setF({ ...g })} className="text-glem-500 hover:underline text-xs">Modifica</button><button onClick={() => elimina(g)} className="text-red-600 hover:underline text-xs">Elimina</button></div></td></tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400">Nessun gruppo creato.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
