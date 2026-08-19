import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useGetTickets } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { TicketCard } from "@/components/TicketCard";
import { asArray } from "@/utils/asArray";
import type { Ticket } from "@workspace/api-client-react";

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Abiertos", value: "open" },
  { label: "En Proceso", value: "in_progress" },
  { label: "Resueltos", value: "resolved" },
  { label: "Cerrados", value: "closed" },
];

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedStatus, setSelectedStatus] = useState("");

  const params: Record<string, string> = {};
  if (selectedStatus) params.status = selectedStatus;

  const {
    data: tickets,
    isLoading,
    isFetching,
    refetch,
  } = useGetTickets(params as Parameters<typeof useGetTickets>[0]);

  const ticketList: Ticket[] = asArray<Ticket>(tickets);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Tickets</Text>
        <Pressable
          onPress={() => router.push("/new-ticket")}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      >
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setSelectedStatus(f.value)}
            style={[
              styles.filterChip,
              selectedStatus === f.value && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tickets List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.light.tint} />
        </View>
      ) : ticketList.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Sin tickets</Text>
          <Text style={styles.emptyDesc}>
            {selectedStatus ? "No hay tickets con ese filtro" : "Crea tu primer ticket"}
          </Text>
          <Pressable
            onPress={() => router.push("/new-ticket")}
            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.createBtnText}>Nuevo Ticket</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ticketList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={Colors.light.tint}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  createBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
