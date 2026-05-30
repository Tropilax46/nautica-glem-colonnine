import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { Api } from "../services/api";
import { useAuthStore } from "../services/auth";

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ email: "", password: "", nome: "", telefono: "", barca: "" });
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    if (!form.email || !form.password || !form.nome) {
      return Alert.alert("Compila almeno email, password e nome");
    }
    setLoading(true);
    try {
      await Api.register(form);
      await login(form.email, form.password);
    } catch (e: any) {
      Alert.alert("Registrazione fallita", e.response?.data?.detail ?? "Riprova");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Crea il tuo account</Text>

      <TextInput style={s.input} placeholder="Nome e cognome" value={form.nome} onChangeText={set("nome")} />
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set("email")} />
      <TextInput style={s.input} placeholder="Telefono" keyboardType="phone-pad" value={form.telefono} onChangeText={set("telefono")} />
      <TextInput style={s.input} placeholder="Nome barca (opzionale)" value={form.barca} onChangeText={set("barca")} />
      <TextInput style={s.input} placeholder="Password (min 8 caratteri)" secureTextEntry value={form.password} onChangeText={set("password")} />

      <TouchableOpacity style={s.btn} onPress={onSubmit} disabled={loading}>
        <Text style={s.btnText}>{loading ? "Creazione…" : "Registrati"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>Hai già un account? Accedi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24, color: "#0b4f6c", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#0b4f6c", padding: 14, borderRadius: 8, marginTop: 8 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  link: { color: "#0b4f6c", textAlign: "center", marginTop: 16 },
});
