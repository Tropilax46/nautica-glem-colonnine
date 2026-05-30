/**
 * Client HTTP centralizzato per il backend FastAPI.
 * BASE_URL va impostato a runtime (.env / app.json extra).
 */
import axios from "axios";
import { useAuthStore } from "./auth";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.nauticaglem.it";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ------- helper tipizzati -------

export type Colonnina = {
  id: string;
  nome: string;
  posto_barca: string;
  lat: number;
  lng: number;
  prese: { numero: number; stato: "libera" | "occupata" | "fuori_servizio" }[];
  tariffa_eur_kwh: number;
};

export type Sessione = {
  id: string;
  colonnina_id: string;
  presa: number;
  started_at: string;
  ended_at: string | null;
  kwh: number;
  cost_eur: number;
  status: "pending" | "active" | "stopping" | "ended" | "error";
};

export const Api = {
  // auth
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { email: string; password: string; nome: string; telefono: string; barca?: string }) =>
    api.post("/auth/register", data),
  // utente
  me: () => api.get("/users/me"),
  // colonnine
  listColonnine: () => api.get<Colonnina[]>("/colonnine"),
  getColonnina: (id: string) => api.get<Colonnina>(`/colonnine/${id}`),
  // sessioni
  startSession: (colonnina_id: string, presa: number, max_kwh?: number) =>
    api.post<Sessione>("/sessions", { colonnina_id, presa, max_kwh }),
  stopSession: (id: string) => api.delete<Sessione>(`/sessions/${id}`),
  getSession: (id: string) => api.get<Sessione>(`/sessions/${id}`),
  activeSessions: () => api.get<Sessione[]>("/sessions/active"),
  // wallet
  wallet: () => api.get<{ saldo_eur: number; movimenti: any[] }>("/wallet"),
  topup: (amount_eur: number) =>
    api.post<{ checkout_url: string }>("/wallet/topup", { amount_eur }),
};
