import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  departmentName?: string | null;
  createdBy: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

const statusConfig = {
  open: { label: "Abierto", color: Colors.light.statusOpen, bg: Colors.light.statusOpenBg },
  in_progress: { label: "En Proceso", color: Colors.light.statusInProgress, bg: Colors.light.statusInProgressBg },
  resolved: { label: "Resuelto", color: Colors.light.statusResolved, bg: Colors.light.statusResolvedBg },
  closed: { label: "Cerrado", color: Colors.light.statusClosed, bg: Colors.light.statusClosedBg },
};

const priorityConfig = {
  low: { label: "Baja", color: Colors.light.priorityLow, icon: "arrow-down" as const },
  medium: { label: "Media", color: Colors.light.priorityMedium, icon: "minus" as const },
  high: { label: "Alta", color: Colors.light.priorityHigh, icon: "arrow-up" as const },
  urgent: { label: "Urgente", color: Colors.light.priorityUrgent, icon: "alert-circle" as const },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
        <Text style={styles.ticketId}>#{ticket.id}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{ticket.description}</Text>

      <View style={styles.footer}>
        {ticket.departmentName ? (
          <View style={styles.footerItem}>
            <Feather name="grid" size={12} color={Colors.light.textTertiary} />
            <Text style={styles.footerText}>{ticket.departmentName}</Text>
          </View>
        ) : null}
        <View style={styles.footerItem}>
          <Feather name="message-circle" size={12} color={Colors.light.textTertiary} />
          <Text style={styles.footerText}>{ticket.commentCount}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.dateText}>{formatRelativeDate(ticket.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketId: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 21,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
});
