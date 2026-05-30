/**
 * Store autenticazione globale (Zustand) con persistenza in SecureStore.
 */
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Api } from "./api";

type AuthState = {
  token: string | null;
  refresh: string | null;
  user: { id: string; email: string; nome: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refresh: null,
  user: null,

  login: async (email, password) => {
    const { data } = await Api.login(email, password);
    await SecureStore.setItemAsync("token", data.access_token);
    await SecureStore.setItemAsync("refresh", data.refresh_token);
    set({ token: data.access_token, refresh: data.refresh_token, user: data.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh");
    set({ token: null, refresh: null, user: null });
  },

  restore: async () => {
    const token = await SecureStore.getItemAsync("token");
    const refresh = await SecureStore.getItemAsync("refresh");
    if (token) {
      try {
        const { data } = await Api.me();
        set({ token, refresh, user: data });
      } catch {
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("refresh");
      }
    }
  },
}));
