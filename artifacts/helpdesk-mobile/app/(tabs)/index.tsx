import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useGetStats, useGetTickets, type Ticket } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { TicketCard } from "@/components/TicketCard";
import { asArray } from "@/utils/asArray";

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useGetStats();
  const {
    data: tickets,
    isLoading: ticketsLoading,
    isFetching: ticketsFetching,
    refetch: refetchTickets,
  } = useGetTickets({ status: "open" });

  /** API / caché: nullish y valores no-array → lista vacía */
  const openTickets: Ticket[] = asArray<Ticket>(tickets);
  /** Pull-to-refresh: solo cuando ya hay datos y una query está refetching */
  const isPullRefreshing =
    (statsFetching || ticketsFetching) && !statsLoading && !ticketsLoading;

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: topPadding,
        paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100,
        paddingHorizontal: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={() => {
            void refetchStats();
            void refetchTickets();
          }}
          tintColor={Colors.light.tint}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.name ?? "Usuario"}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/new-ticket")}
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Resumen</Text>
      {statsLoading ? (
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.statCard, styles.skeletonStat]} />
          ))}
        </View>
      ) : stats ? (
        <View style={styles.statsGrid}>
          <StatCard label="Abiertos" value={stats.openTickets} color={Colors.light.statusOpen} icon="circle" />
          <StatCard label="En Proceso" value={stats.inProgressTickets} color={Colors.light.statusInProgress} icon="clock" />
          <StatCard label="Resueltos" value={stats.resolvedTickets} color={Colors.light.statusResolved} icon="check-circle" />
          <StatCard label="Urgentes" value={stats.urgentTickets} color={Colors.light.priorityUrgent} icon="alert-circle" />
        </View>
      ) : null}

      {/* Recent Open Tickets */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tickets Abiertos</Text>
        <Pressable onPress={() => router.push("/(tabs)/tickets")} hitSlop={8}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </Pressable>
      </View>

      {ticketsLoading ? (
        <View style={styles.ticketSkeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.ticketSkeleton} />
          ))}
        </View>
      ) : openTickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Sin tickets abiertos</Text>
          <Text style={styles.emptyDesc}>¡Todo está al día!</Text>
        </View>
      ) : (
        openTickets.slice(0, 5).map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  skeletonStat: {
    minHeight: 88,
    backgroundColor: Colors.light.backgroundSecondary,
    borderColor: Colors.light.cardBorder,
    borderWidth: 1,
    opacity: 0.85,
  },
  ticketSkeletonList: {
    gap: 12,
    marginBottom: 8,
  },
  ticketSkeleton: {
    height: 96,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
});
