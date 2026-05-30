import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { Api, Colonnina } from "../services/api";

export default function HomeScreen({ navigation }: any) {
  const [list, setList] = useState<Colonnina[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await Api.listColonnine();
      setList(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liberePerColonnina = (c: Colonnina) => c.prese.filter((p) => p.stato === "libera").length;

  return (
    <View style={s.container}>
      <Text style={s.h1}>Colonnine al molo</Text>
      <Text style={s.sub}>Tocca per vedere le prese disponibili</Text>

      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const libere = liberePerColonnina(item);
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate("Dettaglio", { colonnina: item })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.nome}</Text>
                <Text style={s.cardSub}>
                  Posto {item.posto_barca} · {item.tariffa_eur_kwh.toFixed(2)} €/kWh
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: libere > 0 ? "#2ecc71" : "#e74c3c" }]}>
                <Text style={s.badgeText}>{libere}/{item.prese.length}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={!refreshing ? <Text style={s.empty}>Nessuna colonnina trovata</Text> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fa" },
  h1: { fontSize: 22, fontWeight: "700", color: "#0b4f6c" },
  sub: { color: "#666", marginBottom: 12 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, alignItems: "center", elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSub: { color: "#666", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#999", marginTop: 32 },
});
