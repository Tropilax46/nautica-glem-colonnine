import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { Api, Sessione, BASE_URL } from "../services/api";
import { useAuthStore } from "../services/auth";

/**
 * Mostra la sessione live (kWh erogati, € spesi, tempo).
 * Si aggiorna via WebSocket /ws/sessions/{id} ricevendo telemetry dal backend.
 */
export default function SessionScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [sess, setSess] = useState<Sessione | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    Api.getSession(sessionId).then(({ data }) => setSess(data));
    const token = useAuthStore.getState().token;
    const wsUrl = BASE_URL.replace(/^http/, "ws") + `/ws/sessions/${sessionId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg: Sessione = JSON.parse(ev.data);
        setSess(msg);
        if (msg.status === "ended" || msg.status === "error") {
          ws.close();
        }
      } catch {}
    };
    return () => ws.close();
  }, [sessionId]);

  const onStop = async () => {
    Alert.alert("Termina sessione", "Vuoi davvero fermare il prelievo?", [
      { text: "No" },
      {
        text: "Sì",
        style: "destructive",
        onPress: async () => {
          try {
            await Api.stopSession(sessionId);
          } catch (e: any) {
            Alert.alert("Errore", e.response?.data?.detail ?? "Riprova");
          }
        },
      },
    ]);
  };

  if (!sess) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  const minuti = sess.started_at
    ? Math.floor((Date.now() - new Date(sess.started_at).getTime()) / 60000)
    : 0;
  const conclusa = sess.status === "ended" || sess.status === "error";

  return (
    <View style={s.container}>
      <Text style={s.label}>{conclusa ? "Sessione conclusa" : "Sessione in corso"}</Text>

      <View style={s.big}>
        <Text style={s.kwh}>{sess.kwh.toFixed(2)}</Text>
        <Text style={s.kwhUnit}>kWh</Text>
      </View>

      <View style={s.row}>
        <View style={s.cell}>
          <Text style={s.cellLabel}>Spesa</Text>
          <Text style={s.cellVal}>€ {sess.cost_eur.toFixed(2)}</Text>
        </View>
        <View style={s.cell}>
          <Text style={s.cellLabel}>Durata</Text>
          <Text style={s.cellVal}>{minuti} min</Text>
        </View>
        <View style={s.cell}>
          <Text style={s.cellLabel}>Presa</Text>
          <Text style={s.cellVal}>{sess.presa}</Text>
        </View>
      </View>

      {!conclusa ? (
        <TouchableOpacity style={s.stop} onPress={onStop}>
          <Text style={s.stopText}>Ferma erogazione</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.done} onPress={() => navigation.popToTop()}>
          <Text style={s.stopText}>Chiudi</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#0b4f6c", justifyContent: "center" },
  label: { color: "#9bd1e5", textAlign: "center", fontSize: 16, marginBottom: 24 },
  big: { alignItems: "center", marginVertical: 24 },
  kwh: { fontSize: 96, fontWeight: "800", color: "#fff" },
  kwhUnit: { color: "#9bd1e5", fontSize: 20, marginTop: -8 },
  row: { flexDirection: "row", justifyContent: "space-around", marginVertical: 32 },
  cell: { alignItems: "center" },
  cellLabel: { color: "#9bd1e5" },
  cellVal: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 4 },
  stop: { backgroundColor: "#e74c3c", padding: 18, borderRadius: 12 },
  done: { backgroundColor: "#2ecc71", padding: 18, borderRadius: 12 },
  stopText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
});
