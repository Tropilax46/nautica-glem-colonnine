import Link from "next/link";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { fetcher, supabase, UserOut, SessionOut } from "@/lib/api";

async function breakingNews() {
  const { data } = await supabase.from("news").select("titolo").eq("pubblicato", true).eq("is_breaking", true).order("created_at", { ascending: false }).limit(8);
  return (data ?? []).map((n: any) => n.titolo as string);
}

function Home() {
  const { data: me } = useSWR<UserOut>("/users/me", fetcher);
  const { data: active } = useSWR<SessionOut[]>("/sessions/active", fetcher, { refreshInterval: 4000 });
  const { data: ticker } = useSWR("breaking", breakingNews, { refreshInterval: 60000 });
  const sess = active?.[0];
  const titoli = (ticker && ticker.length ? ticker : ["Benvenuto su Nautica GLEM"]);

  return (
    <Layout title="Nautica GLEM">
      {/* Ultima ora */}
      <Link href="/news" className="mb-4 block overflow-hidden rounded-xl bg-glem-700 text-white">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="shrink-0 rounded bg-white/20 px-2 py-0.5 text-xs font-bold">ULTIMA ORA</span>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker whitespace-nowrap text-sm">{titoli.join("    •    ")}    •    {titoli.join("    •    ")}</div>
          </div>
        </div>
      </Link>

      {/* Sessione corrente */}
      {sess ? (
        <Link href="/sessione" className="mb-4 block">
          <div className="card border-2 border-green-300 bg-green-50">
            <p className="text-sm font-semibold text-green-700">● Sessione in corso · {sess.colonnina_id}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {sess.usa_elettricita && <div><p className="text-xl font-bold text-glem-700">{sess.kwh.toFixed(2)}</p><p className="text-xs text-slate-500">kWh ({sess.potenza_kw.toFixed(1)} kW)</p></div>}
              {sess.usa_acqua && <div><p className="text-xl font-bold text-glem-700">{sess.litri.toFixed(0)}</p><p className="text-xs text-slate-500">litri ({sess.flusso_l_min.toFixed(0)} L/min)</p></div>}
              <div><p className="text-xl font-bold text-glem-700">{sess.costo_totale.toFixed(2)} €</p><p className="text-xs text-slate-500">costo</p></div>
            </div>
            <p className="mt-2 text-center text-sm font-semibold text-glem-700">Apri sessione →</p>
          </div>
        </Link>
      ) : (
        <div className="card mb-4 text-center">
          <div className="text-5xl">📷</div>
          <p className="mt-2 font-semibold">Avvia un prelievo</p>
          <p className="mt-1 text-sm text-slate-500">Inquadra il QR sulla colonnina con la fotocamera del telefono, oppure usa lo scanner.</p>
          <Link href="/scan" className="btn-primary mt-4 inline-block w-auto px-6">Scansiona QR</Link>
          <div className="mt-2"><Link href="/avvia" className="text-sm text-glem-500">Inserisci codice manualmente</Link></div>
        </div>
      )}

      {/* Credito */}
      <div className="card mb-4 flex items-center justify-between bg-glem-500 text-white">
        <div>
          <p className="text-sm opacity-80">Credito disponibile</p>
          <p className="text-2xl font-bold">{me ? `${me.wallet_eur.toFixed(2)} €` : "—"}</p>
        </div>
        <Link href="/wallet" className="rounded-xl bg-white px-4 py-2.5 font-semibold text-glem-700 active:scale-95">Ricarica</Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/colonnine" className="card text-center font-semibold text-glem-700">⚡ Tutte le colonnine</Link>
        <Link href="/sessioni" className="card text-center font-semibold text-glem-700">🧾 Le mie sessioni</Link>
      </div>
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Home /></AuthGuard>); }
