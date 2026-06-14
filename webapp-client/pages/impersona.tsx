import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/api";

export default function Impersona() {
  const router = useRouter();
  const [msg, setMsg] = useState("Accesso in corso…");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const p = new URLSearchParams(hash);
    const at = p.get("at");
    const rt = p.get("rt");
    if (!at || !rt) { setMsg("Link di accesso non valido."); return; }
    supabase.auth.setSession({ access_token: at, refresh_token: rt }).then(({ error }) => {
      if (error) { setMsg("Errore: " + error.message); return; }
      window.history.replaceState(null, "", "/");
      router.replace("/");
    });
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center text-slate-500">{msg}</div>;
}
