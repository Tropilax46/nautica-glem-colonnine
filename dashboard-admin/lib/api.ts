import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://suptzhugjpppcxpblcov.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cHR6aHVnanBwcGN4cGJsY292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODgzNDUsImV4cCI6MjA5Njk2NDM0NX0._ZSr0jtEXaqPUWbNv8ROL2fI-WdXblbGwxpr-DtLrxY";
export const CLIENT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://nautica-glem-app.vercel.app";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const num = (v: any) => (v == null ? 0 : Number(v));
function mapErr(e: any) { const r: any = new Error(e?.message ?? "Errore"); r.response = { data: { detail: e?.message } }; return r; }

/* ── Auth ── */
export async function adminSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw mapErr(error);
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user!.id).single();
  if (prof?.role !== "admin") {
    await supabase.auth.signOut();
    throw new Error("Questo account non ha i permessi di amministratore.");
  }
}
export async function adminSignOut() { await supabase.auth.signOut(); }
export async function hasSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

function qparam(key: string, name: string): string {
  const qi = key.indexOf("?");
  if (qi < 0) return "";
  return new URLSearchParams(key.slice(qi + 1)).get(name) ?? "";
}

/* ── Lettura (SWR) ── */
export async function fetcher(key: string): Promise<any> {
  // KPI dashboard
  if (key === "/admin/stats") {
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [{ count: utenti_totali }, { count: colonnine_totali }, { data: colsOn },
           { count: attiveSess }, { data: mov }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "diportista"),
      supabase.from("colonnine").select("*", { count: "exact", head: true }),
      supabase.from("colonnine").select("online").eq("online", true),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "in_carica"),
      supabase.from("movimenti").select("user_id,ts,type,delta_eur,kwh").gte("ts", since30),
    ]);

    const charges = (mov ?? []).filter((m: any) => m.type === "charge");
    const ricavo = (rows: any[]) => rows.reduce((s, m) => s + Math.max(0, -num(m.delta_eur)), 0);
    const kwhSum = (rows: any[]) => rows.reduce((s, m) => s + num(m.kwh), 0);
    const isAfter = (ts: string, d: Date) => new Date(ts) >= d;

    const byDay: Record<string, { kwh: number; eur: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      byDay[d.toISOString().slice(5, 10)] = { kwh: 0, eur: 0 };
    }
    for (const m of charges) {
      const k = new Date(m.ts).toISOString().slice(5, 10);
      if (byDay[k]) { byDay[k].kwh += num(m.kwh); byDay[k].eur += Math.max(0, -num(m.delta_eur)); }
    }
    const activeUsers = new Set((mov ?? []).map((m: any) => m.user_id)).size;

    return {
      colonnine_totali: colonnine_totali ?? 0,
      colonnine_attive: (colsOn ?? []).length,
      utenti_totali: utenti_totali ?? 0,
      utenti_attivi_30d: activeUsers,
      kwh_oggi: kwhSum(charges.filter((m: any) => isAfter(m.ts, todayStart))),
      ricavi_oggi_eur: ricavo(charges.filter((m: any) => isAfter(m.ts, todayStart))),
      ricavi_mese_eur: ricavo(charges.filter((m: any) => isAfter(m.ts, monthStart))),
      trend_30g: Object.entries(byDay).map(([giorno, v]) => ({ giorno, kwh: Math.round(v.kwh * 10) / 10, eur: Math.round(v.eur) })),
    };
  }

  // Utenti
  if (key.startsWith("/admin/users")) {
    const q = qparam(key, "q").toLowerCase();
    const { data, error } = await supabase.from("profiles")
      .select("id,email,full_name,phone,boat_name,wallet_eur,created_at")
      .eq("role", "diportista").order("created_at", { ascending: false });
    if (error) throw mapErr(error);
    let rows = (data ?? []).map((u: any) => ({
      id: u.id, nome: u.full_name ?? "(senza nome)", email: u.email ?? "",
      telefono: u.phone ?? "", barca: u.boat_name ?? "",
      saldo_eur: num(u.wallet_eur), creato_il: u.created_at,
    }));
    if (q) rows = rows.filter((u) =>
      [u.nome, u.email, u.barca].some((v) => (v ?? "").toLowerCase().includes(q)));
    return rows;
  }

  // Colonnine
  if (key === "/admin/colonnine") {
    const { data, error } = await supabase.rpc("colonnine_stato");
    if (error) throw mapErr(error);
    return (data ?? []).map((c: any) => ({
      id: c.id, nome: c.nome, posto_barca: c.posto_barca ?? "", online: c.online,
      ultima_telemetria: null,
      prese: (c.prese ?? []).map((p: any) => ({ numero: p.numero, stato: p.stato, sessione_id: null, kwh_correnti: 0 })),
    }));
  }

  // Transazioni
  if (key.startsWith("/admin/transactions")) {
    const from = qparam(key, "from"); const to = qparam(key, "to");
    let qb = supabase.from("movimenti")
      .select("id,ts,type,delta_eur,kwh,note,profiles(email)")
      .order("ts", { ascending: false }).limit(1000);
    if (from) qb = qb.gte("ts", from);
    if (to) qb = qb.lte("ts", to + "T23:59:59");
    const { data, error } = await qb;
    if (error) throw mapErr(error);
    const T: Record<string, string> = { topup: "TOPUP", charge: "ENERGY", admin_credit: "ADJUST" };
    return (data ?? []).map((m: any) => ({
      id: m.id, created_at: m.ts, user_email: m.profiles?.email ?? "—",
      type: T[m.type] ?? m.type, kwh: m.kwh != null ? num(m.kwh) : null,
      delta_eur: num(m.delta_eur), colonnina_id: null, session_id: null,
    }));
  }

  throw new Error("Endpoint sconosciuto: " + key);
}

/* ── Azioni ── */
export const api = {
  post: async (url: string, body?: any) => {
    const credit = url.match(/^\/admin\/users\/([^/]+)\/credit$/);
    if (credit) {
      const { error } = await supabase.rpc("admin_accredita", { p_user: credit[1], p_amount: body.amount_eur });
      if (error) throw mapErr(error);
      return { data: { ok: true } };
    }
    const forceOff = url.match(/^\/admin\/colonnine\/([^/]+)\/force-off$/);
    if (forceOff) {
      const { data: sess } = await supabase.from("sessions")
        .select("id").eq("colonnina_id", forceOff[1]).eq("status", "in_carica");
      for (const s of sess ?? []) await supabase.rpc("stop_session", { p_session_id: (s as any).id });
      return { data: { ok: true } };
    }
    throw new Error("Endpoint sconosciuto: " + url);
  },
};

/* ── Impersonazione ── */
export async function impersonate(userId: string): Promise<{ access_token: string; refresh_token: string; email: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/impersonate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    body: JSON.stringify({ user_id: userId }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error ?? "Errore impersonazione");
  return j;
}
