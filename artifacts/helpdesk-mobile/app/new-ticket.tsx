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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useGetDepartments,
  useCreateTicket,
  type Department,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { asArray } from "@/utils/asArray";

const PRIORITY_OPTIONS = [
  { label: "Baja", value: "low" as const, color: Colors.light.priorityLow },
  { label: "Media", value: "medium" as const, color: Colors.light.priorityMedium },
  { label: "Alta", value: "high" as const, color: Colors.light.priorityHigh },
  { label: "Urgente", value: "urgent" as const, color: Colors.light.priorityUrgent },
];

export default function NewTicketScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departments, isLoading: deptsLoading } = useGetDepartments();
  const createTicketMutation = useCreateTicket();

  const departmentList = asArray<Department>(departments);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Error", "El título es obligatorio");
    if (!description.trim()) return Alert.alert("Error", "La descripción es obligatoria");
    if (!departmentId) return Alert.alert("Error", "Selecciona un departamento");
    if (!user) return Alert.alert("Error", "Configura tu perfil primero");

    setIsSubmitting(true);
    try {
      await createTicketMutation.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          priority,
          departmentId,
          createdBy: user.name,
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["getTickets"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo crear el ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 40,
      }}
      bottomOffset={60}
    >
      {/* Priority */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Prioridad</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPriority(opt.value)}
              style={[
                styles.priorityChip,
                { borderColor: opt.color },
                priority === opt.value && { backgroundColor: opt.color },
              ]}
            >
              <Text
                style={[
                  styles.priorityChipText,
                  { color: priority === opt.value ? "#fff" : opt.color },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Describe el problema brevemente"
          placeholderTextColor={Colors.light.textTertiary}
          returnKeyType="next"
          maxLength={120}
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Descripción *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          placeholder="Detalla el problema, pasos para reproducirlo, impacto..."
          placeholderTextColor={Colors.light.textTertiary}
          multiline
          numberOfLines={5}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
      </View>

      {/* Department */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Departamento *</Text>
        {deptsLoading ? (
          <ActivityIndicator color={Colors.light.tint} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.deptGrid}>
            {departmentList.map((dept) => (
              <Pressable
                key={dept.id}
                onPress={() => setDepartmentId(dept.id)}
                style={[
                  styles.deptChip,
                  departmentId === dept.id && styles.deptChipActive,
                ]}
              >
                <View
                  style={[
                    styles.deptDot,
                    { backgroundColor: dept.color },
                  ]}
                />
                <Text
                  style={[
                    styles.deptChipText,
                    departmentId === dept.id && styles.deptChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {dept.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Crear Ticket</Text>
          </>
        )}
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
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
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "right",
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityChip: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  priorityChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  deptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
    flexBasis: "47%",
    flexGrow: 1,
  },
  deptChipActive: {
    backgroundColor: Colors.light.tint + "15",
    borderColor: Colors.light.tint,
  },
  deptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  deptChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    flex: 1,
  },
  deptChipTextActive: {
    color: Colors.light.tint,
    fontFamily: "Inter_600SemiBold",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 4,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
