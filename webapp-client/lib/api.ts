import axios from "axios";
import { demoFetch, demoPost, demoDelete } from "./demo";

/**
 * Modalità demo: ATTIVA di default (la webapp gira su Vercel senza backend).
 * Per collegare il backend FastAPI reale imposta NEXT_PUBLIC_DEMO=0
 * e NEXT_PUBLIC_API_URL=<url-del-backend>.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO !== "0";

const http = axios.create({
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

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
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

/**
 * Wrapper usato dalle pagine. In demo le chiamate sono servite dallo store
 * mock (lib/demo.ts); altrimenti vanno all'istanza axios verso il backend.
 */
export const api = {
  post: (url: string, body?: any) => (DEMO ? demoPost(url, body) : http.post(url, body)),
  delete: (url: string) => (DEMO ? demoDelete(url) : http.delete(url)),
  get: (url: string) => (DEMO ? demoFetch(url).then((data) => ({ data })) : http.get(url)),
};

export const fetcher = (url: string) =>
  DEMO ? demoFetch(url) : http.get(url).then((r) => r.data);

/* ── Tipi (rispecchiano i response_model del backend FastAPI) �