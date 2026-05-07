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
import {
  useGetStats,
  useGetTickets,
  type Stats,
  type Ticket,
} from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { TicketCard } from "@/components/TicketCard";
import { asArray } from "@/utils/asArray";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: FeatherIconName;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={styles.statCardRow}>
        <View style={styles.statTextCol}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <View style={[styles.statIconBadge, { backgroundColor: color }]}>
          <Feather name={icon} size={22} color="#fff" />
        </View>
      </View>
    </View>
  );
}

/** Respuesta por defecto: la UI siempre muestra 4 tarjetas con estilo completo (incluso en carga/error). */
const EMPTY_STATS: Stats = {
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  resolvedTickets: 0,
  closedTickets: 0,
  urgentTickets: 0,
  totalDepartments: 0,
  totalUsers: 0,
};

/** Misma métrica base que el panel admin web (Overview): total + pipeline por estado. */
function statsSummary(stats: Stats) {
  return [
    {
      label: "Total",
      value: stats.totalTickets,
      color: Colors.light.tint,
      icon: "inbox" as const,
    },
    {
      label: "Abiertos",
      value: stats.openTickets,
      color: Colors.light.statusOpen,
      icon: "alert-circle" as const,
    },
    {
      label: "En Proceso",
      value: stats.inProgressTickets,
      color: Colors.light.statusInProgress,
      icon: "clock" as const,
    },
    {
      label: "Resueltos",
      value: stats.resolvedTickets,
      color: Colors.light.statusResolved,
      icon: "check-circle" as const,
    },
  ];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
    isError: statsError,
  } = useGetStats({
    query: {
      queryKey: ["/api/stats", user?.email ?? ""],
    },
  });
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const displayStats = stats ?? EMPTY_STATS;

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
          accessibilityRole="button"
          accessibilityLabel="Nuevo ticket"
          onPress={() => router.push("/new-ticket")}
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Grid — mismo layout para todos los roles (empleado, supervisor, admin). */}
      <Text style={styles.sectionTitle}>Resumen</Text>
      {statsError ? (
        <Text style={styles.statsError}>
          No se pudo cargar el resumen. Tira hacia abajo para reintentar.
        </Text>
      ) : null}
      <View style={styles.statsGrid}>
        {statsSummary(displayStats).map((row) => (
          <StatCard
            key={row.label}
            label={row.label}
            value={row.value}
            color={row.color}
            icon={row.icon}
          />
        ))}
      </View>

      {/* Recent Open Tickets */}
      <View style={styles.ticketsPanel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleFlat}>Tickets Abiertos</Text>
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
          <View style={styles.ticketCardStack}>
            {openTickets.slice(0, 5).map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </View>
        )}
      </View>
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
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionTitleFlat: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 0,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  statsError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.priorityHigh,
    marginBottom: 12,
  },
  ticketsPanel: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketCardStack: {
    gap: 10,
    paddingBottom: 6,
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
  statCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statTextCol: {
    flex: 1,
    minWidth: 0,
  },
  statIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
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
