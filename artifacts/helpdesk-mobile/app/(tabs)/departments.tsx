import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useGetDepartments } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { asArray } from "@/utils/asArray";

type Department = {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ticketCount: number;
};

const DEPT_ICONS: Record<string, string> = {
  "cog": "settings",
  "tool": "tool",
  "users": "users",
  "briefcase": "briefcase",
  "monitor": "monitor",
  "truck": "truck",
  "dollar-sign": "dollar-sign",
  "shield": "shield",
  "heart": "heart",
  "book": "book",
};

function DeptCard({ dept }: { dept: Department }) {
  const iconName = (DEPT_ICONS[dept.icon] || "grid") as keyof typeof Feather.glyphMap;

  return (
    <Pressable
      onPress={() => router.push({
        pathname: "/(tabs)/tickets",
      })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconContainer, { backgroundColor: dept.color + "22" }]}>
        <Feather name={iconName} size={22} color={dept.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.deptName}>{dept.name}</Text>
        {dept.description ? (
          <Text style={styles.deptDesc} numberOfLines={2}>{dept.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketCount}>{dept.ticketCount}</Text>
            <Text style={styles.ticketLabel}>{dept.ticketCount === 1 ? "ticket" : "tickets"}</Text>
          </View>
          {dept.contactEmail ? (
            <View style={styles.contactRow}>
              <Feather name="mail" size={11} color={Colors.light.textTertiary} />
              <Text style={styles.contactText} numberOfLines={1}>{dept.contactEmail}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
    </Pressable>
  );
}

export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    data: departments,
    isLoading,
    isFetching,
    refetch,
  } = useGetDepartments();
  const departmentList = asArray<Department>(departments);
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Text style={styles.title}>Departamentos</Text>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.light.tint} />
        </View>
      ) : departmentList.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="grid" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Sin departamentos</Text>
          <Text style={styles.emptyDesc}>Aún no hay departamentos registrados.</Text>
        </View>
      ) : (
        <FlatList
          data={departmentList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <DeptCard dept={item} />}
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
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
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
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  deptName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  deptDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ticketCount: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  ticketLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  contactText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    flex: 1,
  },
});
