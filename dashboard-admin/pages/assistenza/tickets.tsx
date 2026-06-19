import useSWR from "swr";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/api";

async function load() {
  const { data, error } = await supabase.from("tickets").select("id,oggetto,messaggio,stato,created_at,profiles(full_name,email)").order("created_at", { ascending: false });
  if (error) throw error; return data ?? [];
}
const stati = ["aperto", "in_lavorazione", "chiuso"];
const cls: Record<string, string> = { aperto: "bg-amber-100 text-amber-700", in_lavorazione: "bg-sky-100 text-sky-700", chiuso: "bg-gray-100 text-gray-500" };

export default function Tickets() {
  const { data, mutate } = useSWR("tickets", load, { refreshInterval: 20000 });
  const cambiaStato = async (id: string, stato: string) => { const { error } = await supabase.from("tickets").update({ stato, updated_at: new Date().toISOString() }).eq("id", id); if (error) { alert(error.message); return; } mutate(); };
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Tickets</h1>
      <p className="text-gray-500 mb-6 text-sm">Richieste di assistenza. L'invio dall'app cliente verrà aggiunto in seguito.</p>
      <div className="space-y-3">
        {data?.map((t: any) => (
          <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{t.oggetto}</p>
                <p className="text-xs text-gray-500">{t.profiles?.full_name || t.profiles?.email || "—"} · {new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls[t.stato]}`}>{t.stato.replace("_", " ")}</span>
            </div>
            {t.messaggio && <p className="mt-2 text-sm text-gray-600">{t.messaggio}</p>}
            <div className="mt-3 flex gap-2">
              {stati.map((s) => (
                <button key={s} onClick={() => cambiaStato(t.id, s)} disabled={t.stato === s} className={`rounded border px-2 py-1 text-xs ${t.stato === s ? "border-glem-500 bg-glem-50 text-glem-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{s.replace("_", " ")}</button>
              ))}
            </div>
          </div>
        ))}
        {data && data.length === 0 && <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">Nessun ticket.</div>}
      </div>
    </Layout>
  );
}
