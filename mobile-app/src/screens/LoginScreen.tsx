import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useAuthStore } from "../services/auth";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const onSubmit = async () => {
    if (!email || !password) return Alert.alert("Inserisci email e password");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert("Login fallito", e.response?.data?.detail ?? "Credenziali non valide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.brand}>Nautica GLEM</Text>
      <Text style={s.sub}>Accedi al tuo account</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={s.btn} onPress={onSubmit} disabled={loading}>
        <Text style={s.btnText}>{loading ? "Accesso in corso…" : "Accedi"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Registrazione")}>
        <Text style={s.link}>Non hai un account? Registrati</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  brand: { fontSize: 32, fontWeight: "700", color: "#0b4f6c", textAlign: "center" },
  sub: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 32 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#0b4f6c", padding: 14, borderRadius: 8, marginTop: 8 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  link: { color: "#0b4f6c", textAlign: "center", marginTop: 16 },
});
