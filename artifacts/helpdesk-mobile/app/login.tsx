import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { AUTH_TOKEN_KEY } from "@/constants/authStorage";
import Colors from "@/constants/colors";
import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";
import { useUser } from "@/context/UserContext";

type Role = "employee" | "manager" | "admin";

const ROLES: { label: string; value: Role }[] = [
  { label: "Empleado", value: "employee" },
  { label: "Supervisor", value: "manager" },
  { label: "Admin", value: "admin" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { setUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const base = resolveApiBaseUrl();
    if (!base) {
      Alert.alert(
        "URL del API",
        "En teléfono real necesitas EXPO_PUBLIC_API_URL en helpdesk-mobile/.env apuntando a tu API HTTPS en Railway (copia .env.example). En EAS: secreto EXPO_PUBLIC_API_URL en expo.dev para preview/production.",
      );
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert("Faltan datos", "Correo y contraseña son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          assertedRole: role,
        }),
      });

      const data = (await res.json()) as {
        user?: { name: string; email: string; role: Role };
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
      }

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await setUser({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
      await queryClient.invalidateQueries();
      router.replace("/(tabs)");
    } catch (e) {
      let msg = e instanceof Error ? e.message : "No se pudo iniciar sesión";
      if (msg === "Network request failed" || msg.includes("Failed to fetch")) {
        msg =
          "No hay conexión al servidor. Comprueba EXPO_PUBLIC_API_URL (HTTPS Railway), que el api-server esté en marcha y prueba GET " +
          base +
          "/api/healthz en el navegador.";
      }
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>HelpDesk</Text>
        <Text style={styles.subtitle}>Inicia sesión con la misma cuenta que en el panel admin.</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tu@empresa.com"
          placeholderTextColor={Colors.light.textTertiary}
          style={styles.input}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.light.textTertiary}
          style={styles.input}
        />

        <Text style={styles.label}>Rol declarado</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[styles.roleChip, role === r.value && styles.roleChipActive]}
            >
              <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => void onSubmit()}
          disabled={submitting}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="log-in" size={18} color="#fff" />
              <Text style={styles.btnText}>Entrar</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    marginBottom: 16,
  },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
  },
  roleChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  roleChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  roleChipTextActive: { color: "#fff" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
  },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
