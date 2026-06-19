import useSWR from "swr";
import { useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/api";

type N = { id: string; titolo: string; sommario: string | null; corpo: string | null; cover_url: string | null; is_breaking: boolean; pubblicato: boolean; created_at: string };
async function load() {
  const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
  if (error) throw error; return (data ?? []) as N[];
}
const vuoto = { id: "", titolo: "", sommario: "", corpo: "", cover_url: "", is_breaking: false, pubblicato: true };

export default function NewsAdmin() {
  const { data, mutate } = useSWR("admin-news", load);
  const [form, setForm] = useState<any>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const salva = async () => {
    if (!form.titolo?.trim()) { alert("Titolo obbligatorio"); return; }
    const payload = { titolo: form.titolo, sommario: form.sommario || null, corpo: form.corpo || null, cover_url: form.cover_url || null, is_breaking: !!form.is_breaking, pubblicato: !!form.pubblicato, updated_at: new Date().toISOString() };
    const res = form.id ? await supabase.from("news").update(payload).eq("id", form.id) : await supabase.from("news").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setForm(null); mutate();
  };
  const elimina = async (n: N) => {
    if (!confirm(`Eliminare "${n.titolo}"?`)) return;
    const { error } = await supabase.from("news").delete().eq("id", n.id);
    if (error) { alert(error.message); return; } mutate();
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">News</h1>
        <button onClick={() => setForm({ ...vuoto })} className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700 w-full sm:w-auto">+ Nuovo articolo</button>
      </div>

      {form && (
        <div className="mb-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm space-y-3">
          <p className="font-semibold">{form.id ? "Modifica articolo" : "Nuovo articolo"}</p>
          <input className="w-full border rounded p-2" placeholder="Titolo *" value={form.titolo} onChange={(e) => set("titolo", e.target.value)} />
          <input className="w-full border rounded p-2" placeholder="Sommario" value={form.sommario ?? ""} onChange={(e) => set("sommario", e.target.value)} />
          <textarea className="w-full border rounded p-2" rows={5} placeholder="Corpo dell'articolo" value={form.corpo ?? ""} onChange={(e) => set("corpo", e.target.value)} />
          <input className="w-full border rounded p-2" placeholder="URL immagine di copertina (opzionale)" value={form.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-glem-500" checked={form.is_breaking} onChange={(e) => set("is_breaking", e.target.checked)} /> Ultima ora</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-glem-500" checked={form.pubblicato} onChange={(e) => set("pubblicato", e.target.checked)} /> Pubblicato</label>
          </div>
          <div className="flex gap-2">
            <button onClick={salva} className="rounded bg-glem-500 px-4 py-2 text-white hover:bg-glem-700">Salva</button>
            <button onClick={() => setForm(null)} className="rounded px-4 py-2 text-slate-500">Annulla</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Titolo</th><th className="p-3">Stato</th><th className="p-3">Data</th><th className="p-3 text-right">Azioni</th></tr>
          </thead>
          <tbody>
            {data?.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-3 font-medium">{n.is_breaking && <span className="mr-1 text-red-500">●</span>}{n.titolo}</td>
                <td className="p-3"><span className={`rounded px-2 py-1 text-xs ${n.pubblicato ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{n.pubblicato ? "pubblicato" : "bozza"}</span></td>
                <td className="p-3 text-gray-500">{new Date(n.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setForm({ ...n })} className="text-glem-500 hover:underline text-xs">Modifica</button>
                    <button onClick={() => elimina(n)} className="text-red-600 hover:underline text-xs">Elimina</button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nessun articolo.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">In futuro: generazione automatica di articoli per aumentare le visualizzazioni.</p>
    </Layout>
  );
}
