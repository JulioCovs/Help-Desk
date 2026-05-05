import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useGetTickets, type Ticket } from "@workspace/api-client-react";
import { useUser } from "@/context/UserContext";
import { AUTH_TOKEN_KEY } from "@/constants/authStorage";
import Colors from "@/constants/colors";
import { asArray } from "@/utils/asArray";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const ROLE_OPTIONS = [
  { label: "Empleado", value: "employee" as const },
  { label: "Supervisor", value: "manager" as const },
  { label: "Admin", value: "admin" as const },
];

function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setUser, clearUser } = useUser();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<"employee" | "manager" | "admin">(user?.role ?? "employee");
  const [isSaving, setIsSaving] = useState(false);

  const { data: myTickets, isLoading: myTicketsLoading } = useGetTickets(
    user?.name ? { createdBy: user.name } : {},
  );

  const myTicketsList: Ticket[] = asArray(myTickets);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Error", "El nombre y correo son obligatorios");
      return;
    }
    setIsSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setUser({ name: name.trim(), email: email.trim(), role });
      Alert.alert("Guardado", "Tu perfil fue actualizado");
    } finally {
      setIsSaving(false);
    }
  };

  const openTickets = myTicketsList.filter((t) => t.status === "open").length;
  const totalTickets = myTicketsList.length;

  const handleLogout = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await clearUser();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{
        paddingTop: topPadding,
        paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100,
        paddingHorizontal: 16,
      }}
      bottomOffset={20}
    >
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <Avatar name={name || "U"} />
        <Text style={styles.displayName}>{user?.name ?? "Mi Perfil"}</Text>
        <Text style={styles.roleLabel}>
          {ROLE_OPTIONS.find((r) => r.value === role)?.label ?? "Empleado"}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          {myTicketsLoading ? (
            <ActivityIndicator color={Colors.light.tint} style={{ marginVertical: 4 }} />
          ) : (
            <Text style={styles.statNum}>{totalTickets}</Text>
          )}
          <Text style={styles.statLbl}>Tickets totales</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          {myTicketsLoading ? (
            <ActivityIndicator color={Colors.light.statusOpen} style={{ marginVertical: 4 }} />
          ) : (
            <Text style={[styles.statNum, { color: Colors.light.statusOpen }]}>{openTickets}</Text>
          )}
          <Text style={styles.statLbl}>Abiertos</Text>
        </View>
      </View>

      {/* Form */}
      <Text style={styles.sectionTitle}>Información Personal</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nombre completo</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={Colors.light.textTertiary}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="tu@empresa.com"
          placeholderTextColor={Colors.light.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Rol</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setRole(opt.value)}
              style={[
                styles.roleChip,
                role === opt.value && styles.roleChipActive,
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === opt.value && styles.roleChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={isSaving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
      >
        <Feather name="check" size={18} color="#fff" />
        <Text style={styles.saveBtnText}>{isSaving ? "Guardando..." : "Guardar Perfil"}</Text>
      </Pressable>

      <Pressable
        onPress={() => void handleLogout()}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
      >
        <Feather name="log-out" size={18} color={Colors.light.textSecondary} />
        <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  avatar: {
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  displayName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  roleLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 28,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.cardBorder,
    marginVertical: 12,
  },
  statNum: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLbl: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
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
  roleChipTextActive: {
    color: "#fff",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
  },
  logoutBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
});
