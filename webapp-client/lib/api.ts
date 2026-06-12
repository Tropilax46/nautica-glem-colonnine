import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

const TOKEN_KEY = "glem_client_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (location.pathname !== "/login" && location.pathname !== "/register") {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const fetcher = (url: string) => api.get(url).then((r) => r.data);

/* ── Tipi (rispecchiano i response_model del backend FastAPI) ── */

export interface PresaPublic {
  numero: number;
  stato: "libera" | "occupata" | "fuori_servizio";
}

export interface ColonninaPublic {
  id: string;
  nome: string;
  posto_barca: string;
  tariffa_eur_kwh: number;
  online: boolean;
  prese: PresaPublic[];
}

export interface SessionOut {
  id: string;
  colonnina_id: string;
  presa_n: number;
  status: string;
  kwh: number;
  cost_eur: number;
}

export interface Movimento {
  ts: string;
  type: string;
  delta_eur: number;
  kwh: number;
  note: string | null;
}

export interface WalletOut {
  saldo_eur: number;
  movimenti: Movimento[];
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  boat_name: string | null;
  wallet_eur: number;
}
