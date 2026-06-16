import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://suptzhugjpppcxpblcov.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cHR6aHVnanBwcGN4cGJsY292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODgzNDUsImV4cCI6MjA5Njk2NDM0NX0._ZSr0jtEXaqPUWbNv8ROL2fI-WdXblbGwxpr-DtLrxY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const num = (v: any) => (v == null ? 0 : Number(v));
function mapErr(error: any) {
  const e: any = new Error(error?.message ?? "Errore");
  e.response = { data: { detail: error?.message ?? "Errore" } };
  return e;
}

/* ── Auth ── */
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw mapErr(error);
}
export async function signUp(args: {
  email: string; password: string;
  full_name?: string | null; phone?: string | null; boat_name?: string | null;
}) {
  const { error } = await supabase.auth.signUp({
    email: args.email, password: args.password,
    options: { data: { full_name: args.full_name ?? "", phone: args.phone ?? "", boat_name: args.boat_name ?? "" } },
  });
  if (error) throw mapErr(error);
  const { error: e2 } = await supabase.auth.signInWithPassword({ email: args.email, password: args.password });
  if (e2) throw mapErr(e2);
}
export async function signOut() { await supabase.auth.signOut(); }
export async function hasSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/* ── Lettura (SWR) ── */
export async function fetcher(key: string): Promise<any> {
  if (key === "/users/me") {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Non autenticato");
    const { data, error } = await supabase
      .from("profiles").select("id,email,full_name,phone,boat_name,wallet_eur")
      .eq("id", u.user.id).single();
    if (error) throw mapErr(error);
    return { ...data, wallet_eur: num(data.wallet_eur) };
  }
  if (key === "/colonnine") {
    const { data, error } = await supabase.rpc("colonnine_stato");
    if (error) throw mapErr(error);
    return (data ?? []).map((c: any) => ({
      ...c,
      tariffa_eur_kwh: num(c.tariffa_eur_kwh),
      tariffa_acqua_eur_l: num(c.tariffa_acqua_eur_l),
    }));
  }
  if (key === "/sessions/active") {
    const { data, error } = await supabase.rpc("my_active_session");
    if (error) throw mapErr(error);
    return (data ?? []).map((s: any) => ({
      id: s.id, colonnina_id: s.colonnina_id, presa_n: num(s.presa_n), status: s.status,
      usa_elettricita: s.usa_elettricita, usa_acqua: s.usa_acqua,
      potenza_kw: num(s.potenza_kw), flusso_l_min: num(s.flusso_l_min),
      kwh: num(s.kwh), litri: num(s.litri),
      costo_elettricita: num(s.costo_elettricita), costo_acqua: num(s.costo_acqua),
      costo_totale: num(s.costo_totale), cost_eur: num(s.costo_totale),
      saldo: num(s.saldo), max_debito: num(s.max_debito), disponibile: num(s.disponibile),
      limite_raggiunto: !!s.limite_raggiunto, started_at: s.started_at,
    }));
  }
  if (key === "/wallet") {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Non autenticato");
    const { data: prof } = await supabase.from("profiles").select("wallet_eur").eq("id", u.user.id).single();
    const { data: mov } = await supabase
      .from("movimenti").select("ts,type,delta_eur,kwh,note")
      .order("ts", { ascending: false }).limit(50);
    return {
      saldo_eur: num(prof?.wallet_eur),
      movimenti: (mov ?? []).map((m: any) => ({ ...m, delta_eur: num(m.delta_eur), kwh: num(m.kwh) })),
    };
  }
  throw new Error("Endpoint sconosciuto: " + key);
}

/* ── Azioni ── */
export const api = {
  post: async (url: string, body?: any) => {
    if (url === "/sessions") {
      const { data, error } = await supabase.rpc("start_session", {
        p_qr: body.qr_code, p_max_kwh: body.max_kwh ?? null,
        p_usa_elettricita: body.usa_elettricita ?? true, p_usa_acqua: body.usa_acqua ?? false,
      });
      if (error) throw mapErr(error);
      return { data: { id: data } };
    }
    if (url === "/wallet/topup") {
      const { error } = await supabase.rpc("topup", { p_amount: body.amount_eur });
      if (error) throw mapErr(error);
      const back = typeof window !== "undefined" ? window.location.pathname : "/wallet";
      return { data: { checkout_url: `${back}?topup=ok` } };
    }
    throw new Error("Endpoint sconosciuto: " + url);
  },
  delete: async (url: string) => {
    if (url.startsWith("/sessions/")) {
      const id = url.split("/")[2];
      const { error } = await supabase.rpc("stop_session", { p_session_id: id });
      if (error) throw mapErr(error);
      return { data: { ok: true } };
    }
    throw new Error("Endpoint sconosciuto: " + url);
  },
};

/* Dettaglio colonnina (per il flusso di avvio) */
export async function getColonnina(id: string) {
  const { data, error } = await supabase
    .from("colonnine")
    .select("id,nome,posto_barca,tariffa_eur_kwh,potenza_kw,eroga_elettricita,eroga_acqua,tariffa_acqua_eur_l,flusso_l_min,num_prese,online")
    .eq("id", id).maybeSingle();
  if (error) throw mapErr(error);
  return data;
}

/* ── Tipi ── */
export interface UserOut {
  id: string; email: string; full_name: string | null;
  phone: string | null; boat_name: string | null; wallet_eur: number;
}
export interface PresaPublic { numero: number; stato: string; }
export interface ColonninaPublic {
  id: string; nome: string; posto_barca: string; tariffa_eur_kwh: number;
  eroga_elettricita: boolean; eroga_acqua: boolean; tariffa_acqua_eur_l: number;
  online: boolean; prese: PresaPublic[];
}
export interface SessionOut {
  id: string; colonnina_id: string; presa_n: number; status: string;
  usa_elettricita: boolean; usa_acqua: boolean;
  potenza_kw: number; flusso_l_min: number;
  kwh: number; litri: number;
  costo_elettricita: number; costo_acqua: number; costo_totale: number; cost_eur: number;
  saldo: number; max_debito: number; disponibile: number;
  limite_raggiunto: boolean; started_at: string;
}
export interface Movimento {
  ts: string; type: string; delta_eur: number; kwh: number; note: string | null;
}
export interface WalletOut { saldo_eur: number; movimenti: Movimento[]; }
