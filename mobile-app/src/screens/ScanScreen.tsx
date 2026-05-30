import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Api } from "../services/api";

/**
 * Lo sticker QR sulla colonnina contiene un URL del tipo:
 *   nauticaglem://colonnina/<id>?presa=<n>
 * oppure
 *   https://app.nauticaglem.it/c/<id>?presa=<n>
 */
function parseQr(data: string): { colonnina_id: string; presa: number } | null {
  try {
    const url = new URL(data);
    const m = url.pathname.match(/\/(?:colonnina|c)\/([\w-]+)/);
    const presa = parseInt(url.searchParams.get("presa") ?? "1", 10);
    if (!m) return null;
    return { colonnina_id: m[1], presa };
  } catch {
    return null;
  }
}

export default function ScanScreen({ navigation, route }: any) {
  const expected = route.params?.colonnina_id;
  const [permission, setPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) =>
      setPermission(status === "granted")
    );
  }, []);

  const onScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const parsed = parseQr(data);
    if (!parsed) {
      Alert.alert("QR non valido", "Avvicina la fotocamera al QR-code stampato sulla colonnina.");
      setScanned(false);
      return;
    }
    if (expected && parsed.colonnina_id !== expected) {
      Alert.alert("Colonnina diversa", "Il QR appartiene a un'altra colonnina.");
      setScanned(false);
      return;
    }
    try {
      const { data: sess } = await Api.startSession(parsed.colonnina_id, parsed.presa);
      navigation.replace("Sessione", { sessionId: sess.id });
    } catch (e: any) {
      Alert.alert("Avvio fallito", e.response?.data?.detail ?? "Riprova");
      setScanned(false);
    }
  };

  if (permission === null) return <Text style={s.center}>Richiesta permesso fotocamera…</Text>;
  if (!permission) return <Text style={s.center}>Permesso fotocamera negato.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner onBarCodeScanned={scanned ? undefined : onScanned} style={StyleSheet.absoluteFillObject} />
      <View style={s.overlay}>
        <Text style={s.overlayText}>Inquadra il QR sulla colonnina</Text>
        <TouchableOpacity style={s.cancel} onPress={() => navigation.goBack()}>
          <Text style={{ color: "#fff" }}>Annulla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, textAlign: "center", textAlignVertical: "center", padding: 40 },
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, alignItems: "center" },
  overlayText: { color: "#fff", fontSize: 16, marginBottom: 16, textShadowColor: "#000", textShadowRadius: 4 },
  cancel: { backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});
