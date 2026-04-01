import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const BOROUGHS = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const TYPES = ["All", "pre-foreclosure", "foreclosure", "tax-lien", "reo", "auction"];

interface DistressProperty {
  id: string;
  address: string;
  borough: string;
  distressType: string;
  opportunityScore: number;
  estimatedValue: number;
  ownerName: string;
  daysInDistress: number;
  confidenceLevel: string;
}

const DEMO_PROPERTIES: DistressProperty[] = [
  { id: "dp-001", address: "847 Park Ave", borough: "Queens", distressType: "pre-foreclosure", opportunityScore: 87, estimatedValue: 2100000, ownerName: "Estate of R. Martinez", daysInDistress: 142, confidenceLevel: "high" },
  { id: "dp-002", address: "1240 Broadway", borough: "Manhattan", distressType: "foreclosure", opportunityScore: 74, estimatedValue: 3900000, ownerName: "Midtown RE LLC", daysInDistress: 89, confidenceLevel: "high" },
  { id: "dp-003", address: "45 Warren St", borough: "Manhattan", distressType: "tax-lien", opportunityScore: 61, estimatedValue: 4800000, ownerName: "W.Capital Partners LLC", daysInDistress: 54, confidenceLevel: "medium" },
  { id: "dp-004", address: "1890 Adam Powell Blvd", borough: "Manhattan", distressType: "pre-foreclosure", opportunityScore: 82, estimatedValue: 1600000, ownerName: "R&B Holding Corp", daysInDistress: 201, confidenceLevel: "high" },
  { id: "dp-005", address: "95 Eastern Pkwy", borough: "Brooklyn", distressType: "auction", opportunityScore: 79, estimatedValue: 1200000, ownerName: "J. Williams", daysInDistress: 37, confidenceLevel: "medium" },
  { id: "dp-006", address: "2040 Morris Ave", borough: "Bronx", distressType: "reo", opportunityScore: 68, estimatedValue: 780000, ownerName: "First National Bank REO", daysInDistress: 312, confidenceLevel: "high" },
  { id: "dp-007", address: "312 Forest Ave", borough: "Staten Island", distressType: "tax-lien", opportunityScore: 52, estimatedValue: 650000, ownerName: "T. Greco", daysInDistress: 78, confidenceLevel: "low" },
];

const TYPE_COLORS: Record<string, string> = {
  "pre-foreclosure": "#b8943c",
  "foreclosure": "#c0503a",
  "tax-lien": "#8b5cf6",
  "reo": "#3a7ad4",
  "auction": "#ef4444",
};

function formatCurrency(n: number) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + n;
}

function PropertyCard({ property, onPress }: { property: DistressProperty; onPress: () => void }) {
  const colors = useColors();
  const typeColor = TYPE_COLORS[property.distressType] ?? colors.gold;
  const scoreColor = property.opportunityScore >= 80 ? colors.emerald : property.opportunityScore >= 60 ? colors.amber : colors.rose;

  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={[styles.propertyCard, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.02)" }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardAddress, { color: colors.cream }]} numberOfLines={1}>{property.address}</Text>
          <Text style={[styles.cardBorough, { color: colors.mutedForeground }]}>{property.borough} · {property.daysInDistress}d in distress</Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: scoreColor + "40", backgroundColor: scoreColor + "10" }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{property.opportunityScore}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={[styles.typeChip, { backgroundColor: typeColor + "15", borderColor: typeColor + "30" }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>{property.distressType.replace("-", " ")}</Text>
        </View>
        <Text style={[styles.cardValue, { color: colors.gold }]}>{formatCurrency(property.estimatedValue)}</Text>
        <Text style={[styles.cardOwner, { color: colors.mutedForeground }]} numberOfLines={1}>{property.ownerName}</Text>
      </View>
    </Pressable>
  );
}

export default function PropertiesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [minScore, setMinScore] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const { data, refetch } = useQuery({
    queryKey: ["terra-properties", selectedBorough, selectedType, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedBorough !== "All") params.set("borough", selectedBorough);
      if (selectedType !== "All") params.set("distressType", selectedType);
      if (search) params.set("q", search);
      const res = await fetch(API_BASE + "/terra/distress/search?" + params.toString());
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json;
    },
    retry: 1,
  });

  const apiProperties: DistressProperty[] = data?.properties ?? [];
  const displayProperties = (apiProperties.length > 0 ? apiProperties : DEMO_PROPERTIES)
    .filter(p => {
      const matchSearch = !search || p.address.toLowerCase().includes(search.toLowerCase()) || p.ownerName?.toLowerCase().includes(search.toLowerCase());
      const matchBorough = selectedBorough === "All" || p.borough === selectedBorough;
      const matchType = selectedType === "All" || p.distressType === selectedType;
      const matchScore = p.opportunityScore >= minScore;
      return matchSearch && matchBorough && matchType && matchScore;
    });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>TERRA · DISTRESS ENGINE</Text>
        <Text style={[styles.title, { color: colors.cream }]}>Properties</Text>
      </View>

      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <Feather name="search" size={14} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search address or owner..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.cream, fontFamily: "Inter_300Light" }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterScroll}>
        {BOROUGHS.map(b => (
          <Pressable
            key={b}
            onPress={() => { Haptics.selectionAsync(); setSelectedBorough(b); }}
            style={[styles.filterChip, { borderColor: selectedBorough === b ? colors.gold : colors.border, backgroundColor: selectedBorough === b ? colors.goldDim : "transparent" }]}
          >
            <Text style={[styles.filterText, { color: selectedBorough === b ? colors.gold : colors.mutedForeground }]}>{b}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { marginTop: 0 }]} contentContainerStyle={styles.filterScroll}>
        {TYPES.map(t => {
          const typeColor = TYPE_COLORS[t] ?? colors.gold;
          const isSelected = selectedType === t;
          return (
            <Pressable
              key={t}
              onPress={() => { Haptics.selectionAsync(); setSelectedType(t); }}
              style={[styles.filterChip, { borderColor: isSelected ? typeColor : colors.border, backgroundColor: isSelected ? typeColor + "15" : "transparent" }]}
            >
              <Text style={[styles.filterText, { color: isSelected ? typeColor : colors.mutedForeground }]}>{t === "All" ? "All Types" : t.replace("-", " ")}</Text>
            </Pressable>
          );
        })}
      </ScrollView>


      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { marginTop: 0 }]} contentContainerStyle={styles.filterScroll}>
        {[0, 50, 60, 70, 80].map(score => {
          const isSelected = minScore === score;
          const scoreColor = score >= 80 ? colors.emerald : score >= 60 ? colors.amber : colors.gold;
          return (
            <Pressable
              key={score}
              onPress={() => { Haptics.selectionAsync(); setMinScore(score); }}
              style={[styles.filterChip, { borderColor: isSelected ? scoreColor : colors.border, backgroundColor: isSelected ? scoreColor + "15" : "transparent" }]}
            >
              <Text style={[styles.filterText, { color: isSelected ? scoreColor : colors.mutedForeground }]}>
                {score === 0 ? "Any Score" : "Score " + score + "+"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.resultsRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>{displayProperties.length} properties</Text>
        <Text style={[styles.resultsMode, { color: apiProperties.length > 0 ? colors.emerald : colors.gold }]}>
          {apiProperties.length > 0 ? "Live data" : "Demo data"}
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
        }
      >
        {displayProperties.map(p => (
          <PropertyCard
            key={p.id}
            property={p}
            onPress={() => router.push({ pathname: "/property/[id]", params: { id: p.id } })}
          />
        ))}
        {displayProperties.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No properties match your filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.02)", marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13 },
  filterRow: { marginBottom: 6 },
  filterScroll: { paddingHorizontal: 20, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  filterText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  resultsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: 1 },
  resultsCount: { fontSize: 10, fontFamily: "Inter_300Light" },
  resultsMode: { fontSize: 10, fontFamily: "Inter_500Medium" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 6 },
  propertyCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 10 },
  cardAddress: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  cardBorough: { fontSize: 10, fontFamily: "Inter_300Light" },
  scoreCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeText: { fontSize: 9, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardOwner: { flex: 1, fontSize: 10, fontFamily: "Inter_300Light" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_300Light" },
});
