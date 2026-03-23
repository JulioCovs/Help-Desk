import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  useGetTicket,
  useGetTicketComments,
  useCreateComment,
  useUpdateTicket,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const STATUS_OPTIONS = [
  { label: "Abierto", value: "open", color: Colors.light.statusOpen, bg: Colors.light.statusOpenBg },
  { label: "En Proceso", value: "in_progress", color: Colors.light.statusInProgress, bg: Colors.light.statusInProgressBg },
  { label: "Resuelto", value: "resolved", color: Colors.light.statusResolved, bg: Colors.light.statusResolvedBg },
  { label: "Cerrado", value: "closed", color: Colors.light.statusClosed, bg: Colors.light.statusClosedBg },
];

const PRIORITY_OPTIONS = [
  { label: "Baja", value: "low", color: Colors.light.priorityLow },
  { label: "Media", value: "medium", color: Colors.light.priorityMedium },
  { label: "Alta", value: "high", color: Colors.light.priorityHigh },
  { label: "Urgente", value: "urgent", color: Colors.light.priorityUrgent },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentBubble({
  comment,
  isOwn,
}: {
  comment: {
    id: number;
    content: string;
    authorName: string;
    isInternal: boolean;
    createdAt: string;
  };
  isOwn: boolean;
}) {
  return (
    <View
      style={[
        styles.bubble,
        isOwn ? styles.bubbleRight : styles.bubbleLeft,
        comment.isInternal && styles.bubbleInternal,
      ]}
    >
      {!isOwn ? (
        <Text style={styles.bubbleAuthor}>{comment.authorName}</Text>
      ) : null}
      <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{comment.content}</Text>
      <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
        {comment.isInternal ? "🔒 " : ""}{formatDate(comment.createdAt)}
      </Text>
    </View>
  );
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = parseInt(id ?? "0");
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { data: ticket, isLoading: ticketLoading } = useGetTicket(ticketId);
  const { data: comments, isLoading: commentsLoading } = useGetTicketComments(ticketId);
  const createCommentMutation = useCreateComment();
  const updateTicketMutation = useUpdateTicket();

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;
    setIsSending(true);
    try {
      await createCommentMutation.mutateAsync({
        id: ticketId,
        data: { content: commentText.trim(), authorName: user.name },
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["getTicketComments", ticketId] });
      inputRef.current?.focus();
    } catch {
      Alert.alert("Error", "No se pudo enviar el comentario");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        data: { status: newStatus as "open" | "in_progress" | "resolved" | "closed" },
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["getTicket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["getTickets"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });
    } catch {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  if (ticketLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.light.tint} size="large" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Feather name="alert-circle" size={40} color={Colors.light.textTertiary} />
        <Text style={styles.notFoundText}>Ticket no encontrado</Text>
      </View>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === ticket.status);
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === ticket.priority);

  return (
    <>
      <Stack.Screen
        options={{
          title: `#${ticket.id}`,
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.tint,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <View style={styles.badgeRow}>
              {currentStatus ? (
                <View style={[styles.badge, { backgroundColor: currentStatus.bg }]}>
                  <Text style={[styles.badgeText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
                </View>
              ) : null}
              {currentPriority ? (
                <View style={[styles.badge, { backgroundColor: currentPriority.color + "22" }]}>
                  <Text style={[styles.badgeText, { color: currentPriority.color }]}>{currentPriority.label}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Feather name="grid" size={14} color={Colors.light.textTertiary} />
              <Text style={styles.metaLabel}>Área:</Text>
              <Text style={styles.metaValue}>{ticket.departmentName ?? "—"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="user" size={14} color={Colors.light.textTertiary} />
              <Text style={styles.metaLabel}>Creado por:</Text>
              <Text style={styles.metaValue}>{ticket.createdBy}</Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={14} color={Colors.light.textTertiary} />
              <Text style={styles.metaLabel}>Fecha:</Text>
              <Text style={styles.metaValue}>{formatDate(ticket.createdAt)}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{ticket.description}</Text>
          </View>

          {/* Status Changer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambiar Estado</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => handleStatusChange(s.value)}
                  style={[
                    styles.statusChip,
                    { backgroundColor: s.bg },
                    ticket.status === s.value && { borderWidth: 2, borderColor: s.color },
                  ]}
                >
                  <Text style={[styles.statusChipText, { color: s.color }]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comentarios ({comments?.length ?? 0})
            </Text>
            {commentsLoading ? (
              <ActivityIndicator color={Colors.light.tint} />
            ) : !comments || comments.length === 0 ? (
              <Text style={styles.noComments}>Aún no hay comentarios</Text>
            ) : (
              comments.map((c) => (
                <CommentBubble
                  key={c.id}
                  comment={c}
                  isOwn={c.authorName === user?.name}
                />
              ))
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Escribe un comentario..."
            placeholderTextColor={Colors.light.textTertiary}
            style={styles.commentInput}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim() || isSending || !user}
            style={({ pressed }) => [
              styles.sendBtn,
              (!commentText.trim() || isSending || !user) && styles.sendBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  ticketHeader: { marginBottom: 14 },
  ticketTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: 10,
  },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  metaCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    flex: 1,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  bubble: {
    maxWidth: "80%",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  bubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  bubbleInternal: {
    borderWidth: 1,
    borderColor: Colors.light.statusInProgress,
    borderStyle: "dashed",
  },
  bubbleAuthor: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    marginBottom: 3,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: "#fff",
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  bubbleTimeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  noComments: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.cardBorder,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.light.textTertiary,
  },
});
