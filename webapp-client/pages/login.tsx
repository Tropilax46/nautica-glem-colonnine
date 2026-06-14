import { useRouter } from "next/router";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Credenziali non valide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-4xl">⚓</div>
        <h1 className="mt-2 text-2xl font-bold text-glem-700">Nautica GLEM</h1>
        <p className="text-slate-500">Colonnine del molo</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <input className="input" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Accesso..." : "Accedi"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Non hai un account?{" "}
        <Link href="/register" className="font-semibold text-glem-500">Registrati</Link>
      </p>
    </div>
  );
}
