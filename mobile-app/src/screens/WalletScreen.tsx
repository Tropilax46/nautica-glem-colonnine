import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Linking, Alert, StyleSheet } from "react-native";
import { Api } from "../services/api";

const TAGLI = [10, 25, 50, 100];

export default function WalletScreen() {
  const [saldo, setSaldo] = useState(0);
  const [movimenti, setMovimenti] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await Api.wallet();
      setSaldo(data.saldo_eur);
      setMovimenti(data.movimenti);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ricarica = async (eur: number) => {
    try {
      const { data } = await Api.topup(eur);
      await Linking.openURL(data.checkout_url);
    } catch (e: any) {
      Alert.alert("Ricarica fallita", e.response?.data?.detail ?? "Riprova");
    }
  };

  return (
    <View style={s.container}>
      <View style={s.saldoBox}>
        <Text style={s.saldoLabel}>Saldo</Text>
        <Text style={s.saldoVal}>€ {saldo.toFixed(2)}</Text>
      </View>

      <Text style={s.section}>Ricarica wallet</Text>
      <View style={s.tagli}>
        {TAGLI.map((t) => (
          <TouchableOpacity key={t} style={s.taglio} onPress={() => ricarica(t)}>
            <Text style={s.taglioText}>€ {t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>Movimenti</Text>
      <FlatList
        data={movimenti}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View>
              <Text style={s.rowTitle}>{item.descrizione ?? item.type}</Text>
              <Text style={s.rowSub}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <Text style={[s.rowAmt, { color: item.delta_eur > 0 ? "#2ecc71" : "#333" }]}>
              {item.delta_eur > 0 ? "+" : ""}{item.delta_eur.toFixed(2)} €
            </Text>
          </View>
        )}
        ListEmptyComponent={!refreshing ? <Text style={s.empty}>Nessun movimento</Text> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fa" },
  saldoBox: { backgroundColor: "#0b4f6c", borderRadius: 12, padding: 24, marginBottom: 16 },
  saldoLabel: { color: "#9bd1e5" },
  saldoVal: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 6 },
  section: { fontSize: 16, fontWeight: "600", marginTop: 8, marginBottom: 8 },
  tagli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  taglio: { backgroundColor: "#fff", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: "#0b4f6c" },
  taglioText: { color: "#0b4f6c", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 6 },
  rowTitle: { fontWeight: "600" },
  rowSub: { color: "#999", fontSize: 12, marginTop: 2 },
  rowAmt: { fontWeight: "700" },
  empty: { textAlign: "center", color: "#999", marginTop: 24 },
});
