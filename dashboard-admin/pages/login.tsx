import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.user?.role !== "admin") {
        setErr("Solo gli operatori Nautica GLEM possono accedere.");
        return;
      }
      localStorage.setItem("glem_admin_token", data.access_token);
      router.push("/");
    } catch (e: any) {
      setErr(e.response?.data?.detail ?? "Credenziali non valide");
    } finally {
      setLoading(false);
    }
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
