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

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <Layout title="Profilo">
      <div className="card mb-4">
        <Row label="Nome" value={me?.full_name ?? null} />
        <Row label="Email" value={me?.email ?? null} />
        <Row label="Telefono" value={me?.phone ?? null} />
        <Row label="Barca" value={me?.boat_name ?? null} />
        <Row label="Saldo wallet" value={me ? `${me.wallet_eur.toFixed(2)} €` : null} />
      </div>
      <button onClick={logout}
        className="w-full rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-600 active:scale-[0.98]">
        Esci
      </button>
      <p className="mt-6 text-center text-xs text-slate-400">
        Nautica GLEM — Colonnine molo smart · webapp client v0.2
      </p>
    </Layout>
  );
}

export default function Page() {
  return (<AuthGuard><Profilo /></AuthGuard>);
}
