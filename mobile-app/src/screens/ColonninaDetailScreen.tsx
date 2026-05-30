import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Colonnina } from "../services/api";

export default function ColonninaDetailScreen({ route, navigation }: any) {
  const colonnina: Colonnina = route.params.colonnina;

  return (
    <ScrollView style={s.container}>
      <Text style={s.h1}>{colonnina.nome}</Text>
      <Text style={s.sub}>Posto barca {colonnina.posto_barca}</Text>
      <Text style={s.tariffa}>{colonnina.tariffa_eur_kwh.toFixed(2)} €/kWh</Text>

      <Text style={s.section}>Prese</Text>
      {colonnina.prese.map((p) => (
        <View key={p.numero} style={s.preseRow}>
          <Text style={s.preseTitle}>Presa {p.numero}</Text>
          <Text style={[s.preseStato, p.stato === "libera" ? s.libera : s.occupata]}>
            {p.stato.replace("_", " ")}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={s.btn}
        onPress={() => navigation.navigate("Scan QR", { colonnina_id: colonnina.id })}
      >
        <Text style={s.btnText}>Avvia prelievo (scan QR)</Text>
      </TouchableOpacity>

      <Text style={s.disclaimer}>
        Avviando la sessione accetti la tariffa visualizzata. L'addebito avviene a kWh, ogni 60 s,
        sul tuo wallet prepagato.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  h1: { fontSize: 24, fontWeight: "700", color: "#0b4f6c" },
  sub: { color: "#666", marginTop: 4 },
  tariffa: { fontSize: 18, fontWeight: "600", marginTop: 12, color: "#0b4f6c" },
  section: { fontSize: 16, fontWeight: "600", marginTop: 24, marginBottom: 8 },
  preseRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  preseTitle: { fontSize: 16 },
  preseStato: { fontWeight: "600", textTransform: "capitalize" },
  libera: { color: "#2ecc71" },
  occupata: { color: "#e74c3c" },
  btn: { marginTop: 32, backgroundColor: "#0b4f6c", padding: 16, borderRadius: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
  disclaimer: { marginTop: 16, color: "#999", fontSize: 12 },
});
