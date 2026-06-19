import { useState } from "react";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/api";

const n = (v: any) => (v == null ? 0 : Number(v));
async function loadSessioni() {
  const { data } = await supabase.from("sessions").select("id,colonnina_id,presa_n,kwh,litri,cost_eur,usa_elettricita,usa_acqua,started_at,ended_at,status").order("started_at", { ascending: false }).limit(100);
  return data ?? [];
}
async function loadCredito() {
  const { data } = await supabase.from("movimenti").select("id,ts,type,delta_eur,note").order("ts", { ascending: false }).limit(200);
  return data ?? [];
}

function Sessioni() {
  const [tab, setTab] = useState<"sessioni" | "credito">("sessioni");
  const { data: ses } = useSWR("hist-sessioni", loadSessioni);
  const { data: cre } = useSWR("hist-credito", loadCredito);
  const dt = (s: string) => new Date(s).toLocaleString("it-IT");

  return (
    <Layout title="Sessioni">
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 text-sm">
        <button onClick={() => setTab("sessioni")} className={`flex-1 rounded-lg py-1.5 font-medium ${tab === "sessioni" ? "bg-white text-glem-700 shadow-sm" : "text-slate-500"}`}>Cronologico</button>
        <button onClick={() => setTab("credito")} className={`flex-1 rounded-lg py-1.5 font-medium ${tab === "credito" ? "bg-white text-glem-700 shadow-sm" : "text-slate-500"}`}>Storico credito</button>
      </div>

      {tab === "sessioni" && (
        <div className="space-y-2">
          {ses?.map((s: any) => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{s.colonnina_id} · Presa {s.presa_n}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "in_carica" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{s.status === "in_carica" ? "in corso" : "terminata"}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {s.usa_elettricita && `${n(s.kwh).toFixed(2)} kWh`}{s.usa_elettricita && s.usa_acqua && " · "}{s.usa_acqua && `${n(s.litri).toFixed(0)} L`} · <strong className="text-glem-700">{n(s.cost_eur).toFixed(2)} €</strong>
              </p>
              <p className="text-xs text-slate-400">{dt(s.started_at)}</p>
            </div>
          ))}
          {ses && ses.length === 0 && <p className="text-center text-slate-400">Nessuna sessione registrata.</p>}
        </div>
      )}

      {tab === "credito" && (
        <div className="space-y-2">
          {cre?.map((m: any) => (
            <div key={m.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{m.type === "topup" ? "Ricarica" : m.type === "charge" ? "Prelievo" : "Accredito admin"}</p>
                <p className="text-xs text-slate-400">{dt(m.ts)}{m.note ? ` · ${m.note}` : ""}</p>
              </div>
              <p className={`font-bold ${n(m.delta_eur) >= 0 ? "text-green-600" : "text-slate-700"}`}>{n(m.delta_eur) >= 0 ? "+" : ""}{n(m.delta_eur).toFixed(2)} €</p>
            </div>
          ))}
          {cre && cre.length === 0 && <p className="text-center text-slate-400">Nessun movimento.</p>}
        </div>
      )}
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Sessioni /></AuthGuard>); }
