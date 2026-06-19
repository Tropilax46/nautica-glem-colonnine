import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { signOut, fetcher, UserOut } from "@/lib/api";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function Profilo() {
  const router = useRouter();
  const { data: me } = useSWR<UserOut>("/users/me", fetcher);
  async function logout() { await signOut(); router.replace("/login"); }

  return (
    <Layout title="Profilo">
      <div className="card mb-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-glem-100 text-2xl">👤</div>
        <p className="mt-2 text-lg font-bold text-glem-700">{me?.full_name ?? "Diportista"}</p>
        <p className="text-sm text-slate-500">{me?.email}</p>
      </div>

      <div className="card mb-4">
        <Row label="Telefono" value={me?.phone ?? null} />
        <Row label="Barca" value={me?.boat_name ?? null} />
        <Row label="Credito" value={me ? `${me.wallet_eur.toFixed(2)} €` : null} />
      </div>

      <div className="card mb-4 divide-y divide-slate-100">
        <Link href="/wallet" className="flex items-center justify-between py-3"><span>Ricarica credito</span><span className="text-slate-400">›</span></Link>
        <Link href="/sessioni" className="flex items-center justify-between py-3"><span>Storico sessioni e credito</span><span className="text-slate-400">›</span></Link>
        <Link href="/termini" className="flex items-center justify-between py-3"><span>Termini e condizioni</span><span className="text-slate-400">›</span></Link>
        <Link href="/privacy" className="flex items-center justify-between py-3"><span>Privacy</span><span className="text-slate-400">›</span></Link>
      </div>

      <button onClick={logout} className="w-full rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-600 active:scale-[0.98]">Esci</button>
      <p className="mt-6 text-center text-xs text-slate-400">Nautica GLEM · webapp client v0.3</p>
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Profilo /></AuthGuard>); }
