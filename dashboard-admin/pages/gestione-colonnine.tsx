import useSWR from "swr";
import { useState } from "react";
import Layout from "../components/Layout";
import { supabase, CLIENT_URL } from "../lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function loadCol() { const { data } = await supabase.from("colonnine").select("*").order("id"); return data ?? []; }
async function loadPorti() { const { data } = await supabase.from("porti").select("*").order("nome"); return data ?? []; }

function Porti() {
  const { data, mutate } = useSWR("porti", loadPorti);
  const [f, setF] = useState<any>(null);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const salva = async () => {
    if (!f.nome?.trim() || f.lat === "" || f.lng === "") { alert("Nome, lat e lng obbligatori"); return; }
    const payload = { nome: f.nome, descrizione: f.descrizione || null, lat: parseFloat(f.lat), lng: parseFloat(f.lng) };
    const res = f.id ? await supabase.from("porti").update(payload).eq("id", f.id) : await supabase.from("porti").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setF(null); mutate();
  };
  const elimina = async (p: any) => { if (!confirm(`Eliminare "${p.nome}"?`)) return; const { error } = await supabase.from("porti").delete().eq("id", p.id); if (error) { alert(error.message); return; } mutate(); };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Porti</h2>
        <button onClick={() => setF({ nome: "", descrizione: "", lat: "", lng: "" })} className="rounded bg-glem-500 px-3 py-1.5 text-sm text-white hover:bg-glem-700">+ Aggiungi porto</button>
      </div>
      {f && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm space-y-3">
          <input className="w-full border rounded p-2" placeholder="Nome porto *" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          <input className="w-full border rounded p-2" placeholder="Descrizione" value={f.descrizione ?? ""} onChange={(e) => set("descrizione", e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <input className="w-40 border rounded p-2" placeholder="Latitudine *" value={f.lat} onChange={(e) => set("lat", e.target.value)} />
            <input className="w-40 border rounded p-2" placeholder="Longitudine *" value={f.lng} onChange={(e) => set("lng", e.target.value)} />
          </div>
          <p className="text-xs text-gray-400">Suggerimento: copia lat/lng da Google Maps (click destro sul punto → coordinate).</p>
          <div className="flex gap-2"><button onClick={salva} className="rounded bg-glem-500 px-4 py-2 text-white">Salva</button><button onClick={() => setF(null)} className="rounded px-4 py-2 text-slate-500">Annulla</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Nome</th><th className="p-3">Descrizione</th><th className="p-3">Coordinate</th><th className="p-3 text-right">Azioni</th></tr></thead>
          <tbody>
            {data?.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.nome}</td><td className="p-3 text-gray-500">{p.descrizione || "—"}</td>
                <td className="p-3 font-mono text-xs">{n(p.lat).toFixed(4)}, {n(p.lng).toFixed(4)}</td>
                <td className="p-3 text-right"><div className="flex justify-end gap-3"><button onClick={() => setF({ ...p, lat: String(p.lat), lng: String(p.lng) })} className="text-glem-500 hover:underline text-xs">Modifica</button><button onClick={() => elimina(p)} className="text-red-600 hover:underline text-xs">Elimina</button></div></td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nessun porto. Aggiungine uno per la mappa.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GestioneColonnine() {
  const { data } = useSWR("gestione-colonnine", loadCol);
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Gestione colonnine</h1>

      <h2 className="text-lg font-semibold mb-3">Colonnine</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-8">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">ID</th><th className="p-3">Nome</th><th className="p-3">Eroga</th><th className="p-3">Prese</th><th className="p-3">Stato</th><th className="p-3">Link QR</th></tr></thead>
          <tbody>
            {data?.map((c: any) => {
              const link = `${CLIENT_URL}/avvia?c=${c.id}`;
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-mono">{c.id}</td><td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3 whitespace-nowrap">{c.eroga_elettricita && <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">⚡</span>}{c.eroga_acqua && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">💧</span>}</td>
                  <td className="p-3">{c.num_prese}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${c.online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.online ? "online" : "offline"}</span></td>
                  <td className="p-3"><div className="flex items-center gap-2"><a href={link} target="_blank" rel="noreferrer" className="max-w-[160px] truncate text-xs text-glem-500 hover:underline">{link}</a><button onClick={() => navigator.clipboard?.writeText(link)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Copia</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Porti />

      <h2 className="mt-8 mb-3 text-lg font-semibold">Struttura impianto (in arrivo)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[{ t: "Zone", d: "Aree di un porto" }, { t: "Sezioni / Pontili", d: "Suddivisione delle zone" }, { t: "Tipologie colonnine", d: "Modelli con prese e potenze" }].map((x) => (
          <div key={x.t} className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-5 text-center"><p className="font-medium">{x.t}</p><p className="mt-1 text-xs text-gray-500">{x.d}</p></div>
        ))}
      </div>
    </Layout>
  );
}
