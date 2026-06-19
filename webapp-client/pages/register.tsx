import { useRouter } from "next/router";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { signUp } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const next = typeof router.query.next === "string" ? router.query.next : "/";
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", boat_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email: form.email, password: form.password,
        full_name: form.full_name || null, phone: form.phone || null, boat_name: form.boat_name || null,
      });
      router.replace(next);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-glem-700">Crea il tuo account</h1>
      <form onSubmit={onSubmit} className="card space-y-4">
        <input className="input" type="email" placeholder="Email *" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <input className="input" type="password" placeholder="Password *" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        <input className="input" placeholder="Nome e cognome" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        <input className="input" type="tel" placeholder="Telefono" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <input className="input" placeholder="Nome barca (opzionale)" value={form.boat_name} onChange={(e) => set("boat_name", e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>{loading ? "Registrazione..." : "Registrati"}</button>
      </form>
      <p className="mt-3 text-center text-xs text-slate-400">
        Registrandoti accetti i <Link href="/termini" className="text-glem-500 underline">Termini e condizioni</Link> e l'<Link href="/privacy" className="text-glem-500 underline">Informativa Privacy</Link>.
      </p>
      <p className="mt-4 text-center text-sm text-slate-500">
        Hai già un account?{" "}
        <Link href={`/login${next !== "/" ? "?next=" + encodeURIComponent(next) : ""}`} className="font-semibold text-glem-500">Accedi</Link>
      </p>
    </div>
  );
}
