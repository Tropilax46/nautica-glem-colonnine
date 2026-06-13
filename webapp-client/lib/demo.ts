/**
 * Demo layer — fa funzionare la webapp SENZA backend (per il deploy su Vercel).
 *
 * Quando la modalità demo è attiva (default: ON, vedi lib/api.ts) tutte le
 * chiamate "di rete" sono servite da questo store in-memory, persistito in
 * localStorage così sopravvive ai refresh. La sessione di ricarica è simulata
 * in tempo reale: i kWh crescono in base ai secondi trascorsi dall'avvio, quindi
 * il polling delle pagine mostra dati che si muovono davvero.
 *
 * Per usare il backend FastAPI reale: imposta NEXT_PUBLIC_DEMO=0 (e
 * NEXT_PUBLIC_API_URL) — vedi README.
 */

/* ── Stato persistito ── */

interface DemoUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  boat_name: string | null;
}

interface DemoMovimento {
  ts: string;
  type: string;
  delta_eur: number;
  kwh: number;
  note: string | null;
}

interface DemoSession {
  id: string;
  colonnina_id: string;
  presa_n: number;
  tariffa_eur_kwh: number;
  potenza_kw: number;
  max_kwh: number | null;
  started_at: number; // epoch ms
}

interface DemoState {
  user: DemoUser;
  saldo_eur: number;
  movimenti: DemoMovimento[];
  session: DemoSession | null;
}

const STORE_KEY = "glem_demo_state_v1";

const COLONNINE = [
  { id: "GLEM-A01", nome: "Pontile A — Colonnina 1", posto_barca: "A1–A4", tariffa_eur_kwh: 0.45, online: true,  prese: 2 },
  { id: "GLEM-A02", nome: "Pontile A — Colonnina 2", posto_barca: "A5–A8", tariffa_eur_kwh: 0.45, online: true,  prese: 2 },
  { id: "GLEM-B01", nome: "Pontile B — Colonnina 1", posto_barca: "B1–B4", tariffa_eur_kwh: 0.48, online: true,  prese: 2 },
  { id: "GLEM-B02", nome: "Pontile B — Colonnina 2", posto_barca: "B5–B8", tariffa_eur_kwh: 0.48, online: false, prese: 2 },
  { id: "GLEM-C01", nome: "Pontile C — Colonnina 1", posto_barca: "C1–C6", tariffa_eur_kwh: 0.52, online: true,  prese: 3 },
];

function defaultState(): DemoState {
  const now = Date.now();
  return {
    user: {
      id: "demo-user",
      email: "diportista@nauticaglem.it",
      full_name: "Mario Rossi",
      phone: "+39 333 1234567",
      boat_name: "Santa Lucia",
    },
    saldo_eur: 25,
    movimenti: [
      { ts: new Date(now - 86400000 * 2).toISOString(), type: "topup",  delta_eur: 50, kwh: 0,    note: "Ricarica wallet" },
      { ts: new Date(now - 86400000 * 1).toISOString(), type: "charge", delta_eur: -25, kwh: 55.5, note: "GLEM-A01 · Presa 1" },
    ],
    session: null,
  };
}

function load(): DemoState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const s = defaultState();
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    return defaultState();
  }
}

function save(s: DemoState) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/* ── Helpers sessione live ── */

function sessionKwh(sess: DemoSession): number {
  const hours = (Date.now() - sess.started_at) / 3_600_000;
  let kwh = hours * sess.potenza_kw;
  if (sess.max_kwh != null) kwh = Math.min(kwh, sess.max_kwh);
  return Math.max(0, kwh);
}

function colonninaTariffa(id: string): number {
  return COLONNINE.find((c) => c.id === id)?.tariffa_eur_kwh ?? 0.45;
}

/** Parsa un codice tipo "GLEM-A03-P1" → { colonnina_id, presa_n }. */
function parseQr(code: string): { colonnina_id: string; presa_n: number } {
  const clean = code.trim().toUpperCase();
  const m = clean.match(/^(GLEM-[A-Z]?\d+)(?:-P?(\d+))?$/);
  if (m) return { colonnina_id: m[1], presa_n: m[2] ? parseInt(m[2], 10) : 1 };
  // fallback: accetta qualsiasi codice, sessione su colonnina demo
  return { colonnina_id: COLONNINE[0].id, presa_n: 1 };
}

/* ── API simulata ── */

function ok<T>(data: T) {
  return Promise.resolve({ data });
}
function fail(status: number, detail: string): never {
  const err: any = new Error(detail);
  err.response = { status, data: { detail } };
  throw err;
}

/** GET — usato da useSWR. */
export async function demoFetch(url: string): Promise<any> {
  const s = load();

  if (url === "/users/me") {
    return { ...s.user, wallet_eur: round2(s.saldo_eur) };
  }

  if (url === "/colonnine") {
    const busyKey = s.session ? `${s.session.colonnina_id}#${s.session.presa_n}` : null;
    return COLONNINE.map((c) => ({
      id: c.id,
      nome: c.nome,
      posto_barca: c.posto_barca,
      tariffa_eur_kwh: c.tariffa_eur_kwh,
      online: c.online,
      prese: Array.from({ length: c.prese }, (_, i) => {
        const numero = i + 1;
        let stato: string = c.online ? "libera" : "fuori_servizio";
        if (busyKey === `${c.id}#${numero}`) stato = "occupata";
        return { numero, stato };
      }),
    }));
  }

  if (url === "/sessions/active") {
    if (!s.session) return [];
    const kwh = sessionKwh(s.session);
    return [
      {
        id: s.session.id,
        colonnina_id: s.session.colonnina_id,
        presa_n: s.session.presa_n,
        status: "in_carica",
        kwh: round2(kwh),
        cost_eur: round2(kwh * s.session.tariffa_eur_kwh),
      },
    ];
  }

  if (url === "/wallet") {
    return { saldo_eur: round2(s.saldo_eur), movimenti: s.movimenti };
  }

  return fail(404, `Endpoint demo non gestito: ${url}`);
}

/** POST. */
export async function demoPost(url: string, body?: any): Promise<{ data: any }> {
  const s = load();

  if (url === "/auth/login") {
    // demo: qualunque email/password va bene
    if (body?.email) s.user.email = body.email;
    save(s);
    return ok({ access_token: "demo-token", token_type: "bearer" });
  }

  if (url === "/auth/register") {
    s.user = {
      id: "demo-user",
      email: body?.email ?? s.user.email,
      full_name: body?.full_name ?? null,
      phone: body?.phone ?? null,
      boat_name: body?.boat_name ?? null,
    };
    save(s);
    return ok({ access_token: "demo-token", token_type: "bearer" });
  }

  if (url === "/sessions") {
    if (s.session) fail(409, "Hai già una sessione attiva.");
    if (s.saldo_eur <= 0) fail(402, "Saldo wallet insufficiente. Ricarica il wallet.");
    const { colonnina_id, presa_n } = parseQr(body?.qr_code ?? "");
    s.session = {
      id: "sess-" + Date.now(),
      colonnina_id,
      presa_n,
      tariffa_eur_kwh: colonninaTariffa(colonnina_id),
      potenza_kw: 7.4,
      max_kwh: body?.max_kwh ?? null,
      started_at: Date.now(),
    };
    save(s);
    return ok({ id: s.session.id, status: "in_carica" });
  }

  if (url === "/wallet/topup") {
    const amount = Number(body?.amount_eur ?? 0);
    s.saldo_eur = round2(s.saldo_eur + amount);
    s.movimenti.unshift({
      ts: new Date().toISOString(),
      type: "topup",
      delta_eur: amount,
      kwh: 0,
      note: "Ricarica wallet (demo)",
    });
    save(s);
    // Niente Stripe reale: torniamo subito alla pagina wallet col saldo aggiornato.
    const back = typeof window !== "undefined" ? window.location.pathname : "/wallet";
    return ok({ checkout_url: `${back}?topup=ok` });
  }

  return fail(404, `Endpoint demo non gestito: ${url}`);
}

/** DELETE — stop sessione. */
export async function demoDelete(url: string): Promise<{ data: any }> {
  const s = load();
  if (url.startsWith("/sessions/")) {
    if (s.session) {
      const kwh = sessionKwh(s.session);
      const cost = round2(kwh * s.session.tariffa_eur_kwh);
      s.saldo_eur = round2(s.saldo_eur - cost);
      s.movimenti.unshift({
        ts: new Date().toISOString(),
        type: "charge",
        delta_eur: -cost,
        kwh: round2(kwh),
        note: `${s.session.colonnina_id} · Presa ${s.session.presa_n}`,
      });
      s.session = null;
      save(s);
    }
    return ok({ ok: true });
  }
  return fail(404, `Endpoint demo non gestito: ${url}`);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
