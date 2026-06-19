import { useEffect, useState } from "react";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/api";

type News = { id: string; titolo: string; sommario: string | null; corpo: string | null; cover_url: string | null; is_breaking: boolean; created_at: string };
async function load() {
  const { data, error } = await supabase.from("news").select("*").eq("pubblicato", true).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as News[];
}
type View = "espanso" | "normale" | "mini";

function NewsPage() {
  const { data } = useSWR("news", load, { refreshInterval: 60000 });
  const [view, setView] = useState<View>("normale");
  useEffect(() => { const v = (typeof window !== "undefined" && localStorage.getItem("glem_news_view")) as View | null; if (v) setView(v); }, []);
  const setV = (v: View) => { setView(v); try { localStorage.setItem("glem_news_view", v); } catch {} };
  const dt = (s: string) => new Date(s).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Layout title="News">
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 text-sm">
        {(["espanso", "normale", "mini"] as View[]).map((v) => (
          <button key={v} onClick={() => setV(v)} className={`flex-1 rounded-lg py-1.5 font-medium capitalize ${view === v ? "bg-white text-glem-700 shadow-sm" : "text-slate-500"}`}>{v}</button>
        ))}
      </div>

      {view === "mini" && (
        <div className="divide-y divide-slate-100 rounded-xl bg-white">
          {data?.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{n.is_breaking && <span className="mr-1 text-red-500">●</span>}{n.titolo}</span>
              <span className="ml-3 shrink-0 text-xs text-slate-400">{dt(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {view === "normale" && (
        <div className="space-y-3">
          {data?.map((n) => (
            <div key={n.id} className="card">
              {n.is_breaking && <span className="mb-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">ULTIMA ORA</span>}
              <p className="font-semibold">{n.titolo}</p>
              {n.sommario && <p className="mt-1 text-sm text-slate-500">{n.sommario}</p>}
              <p className="mt-1 text-xs text-slate-400">{dt(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {view === "espanso" && (
        <div className="space-y-4">
          {data?.map((n) => (
            <article key={n.id} className="card">
              {n.cover_url && <img src={n.cover_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
              {n.is_breaking && <span className="mb-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">ULTIMA ORA</span>}
              <h2 className="text-lg font-bold text-glem-700">{n.titolo}</h2>
              <p className="text-xs text-slate-400">{dt(n.created_at)}</p>
              {n.sommario && <p className="mt-2 font-medium text-slate-600">{n.sommario}</p>}
              {n.corpo && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{n.corpo}</p>}
            </article>
          ))}
        </div>
      )}

      {data && data.length === 0 && <p className="text-center text-slate-400">Nessuna news al momento.</p>}
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><NewsPage /></AuthGuard>); }
