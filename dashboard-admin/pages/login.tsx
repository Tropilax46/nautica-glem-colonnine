import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const DEMO_EMAIL = "admin@nauticaglem.it";
  const DEMO_PASSWORD = "admin1234";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    await new Promise((r) => setTimeout(r, 500));
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("glem_admin_token", "demo-token");
      router.push("/");
    } else {
      setErr("Credenziali non valide");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-glem-700">
      <form onSubmit={submit} className="bg-white rounded-xl p-8 w-96 shadow-xl">
        <h1 className="text-2xl font-bold text-glem-700">Nautica GLEM</h1>
        <p className="text-sm text-gray-500 mb-6">Accesso operatore</p>

        <label className="block text-sm mb-1">Email</label>
        <input className="w-full border rounded p-2 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label className="block text-sm mb-1">Password</label>
        <input className="w-full border rounded p-2 mb-4" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

        <button className="w-full bg-glem-500 text-white rounded p-2 font-semibold disabled:opacity-60" disabled={loading}>
          {loading ? "Accesso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
