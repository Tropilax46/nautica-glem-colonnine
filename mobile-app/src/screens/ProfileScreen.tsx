import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuthStore } from "../services/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const conferma = () =>
    Alert.alert("Esci", "Vuoi disconnetterti?", [
      { text: "No" },
      { text: "Esci", style: "destructive", onPress: logout },
    ]);

  return (
    <View style={s.container}>
      <Text style={s.h1}>{user?.nome ?? "Utente"}</Text>
      <Text style={s.sub}>{user?.email}</Text>

      <View style={s.box}>
        <Text style={s.boxLabel}>Versione app</Text>
        <Text style={s.boxVal}>0.1.0</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={conferma}>
        <Text style={s.btnText}>Esci</Text>
      </TouchableOpacity>

      <Text style={s.footer}>
        Per assistenza: support@nauticaglem.it
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  h1: { fontSize: 24, fontWeight: "700", color: "#0b4f6c", marginTop: 16 },
  sub: { color: "#666", marginTop: 4 },
  box: { backgroundColor: "#f5f7fa", padding: 16, borderRadius: 10, marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  boxLabel: { color: "#666" },
  boxVal: { fontWeight: "700" },
  btn: { backgroundColor: "#e74c3c", padding: 14, borderRadius: 10, marginTop: 32 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
  footer: { textAlign: "center", color: "#999", marginTop: 32 },
});
