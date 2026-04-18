import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  DimensionValue,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const ACCENT = "#c87941";

interface Milestone {
  id: string;
  label: string;
  dueDate: string;
  status: "complete" | "in-progress" | "upcoming" | "delayed";
  completedDate?: string;
}

interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
  committed: number;
}

interface ConstructionProject {
  id: string;
  name: string;
  address: string;
  type: string;
  totalBudget: number;
  spentToDate: number;
  percentComplete: number;
  startDate: string;
  targetCompletion: string;
  gcName: string;
  inspectionStatus: "passed" | "pending" | "failed" | "scheduled";
  flags: string[];
  milestones: Milestone[];
  budgetLines: BudgetLine[];
}

const STATUS_COLORS: Record<string, string> = {
  complete: "#34d399",
  "in-progress": "#60a5fa",
  upcoming: "rgba(255,255,255,0.25)",
  delayed: "#ef4444",
};

const INSPECTION_COLORS: Record<string, string> = {
  passed: "#34d399",
  pending: "#fbbf24",
  failed: "#ef4444",
  scheduled: "#60a5fa",
};

const PROJECTS: ConstructionProject[] = [
  {
    id: "cp-1",
    name: "Harborview Mixed-Use",
    address: "850 Harbor Ave, Miami, FL",
    type: "Mixed-Use Development",
    totalBudget: 12_400_000,
    spentToDate: 7_920_000,
    percentComplete: 63,
    startDate: "Jan 2024",
    targetCompletion: "Nov 2025",
    gcName: "Meridian Construction Group",
    inspectionStatus: "passed",
    flags: ["Steel delivery delayed 3 weeks", "Change order #14 pending approval"],
    milestones: [
      { id: "m1", label: "Site Prep & Demo", dueDate: "Mar 2024", status: "complete", completedDate: "Mar 2024" },
      { id: "m2", label: "Foundation & Slab", dueDate: "Jun 2024", status: "complete", completedDate: "Jul 2024" },
      { id: "m3", label: "Steel Framing", dueDate: "Oct 2024", status: "complete", completedDate: "Nov 2024" },
      { id: "m4", label: "MEP Rough-In", dueDate: "Feb 2025", status: "in-progress" },
      { id: "m5", label: "Exterior Envelope", dueDate: "May 2025", status: "upcoming" },
      { id: "m6", label: "Interior Finishes", dueDate: "Aug 2025", status: "upcoming" },
      { id: "m7", label: "Certificate of Occupancy", dueDate: "Nov 2025", status: "upcoming" },
    ],
    budgetLines: [
      { category: "Site Work", budgeted: 1_100_000, spent: 1_100_000, committed: 0 },
      { category: "Foundation", budgeted: 1_800_000, spent: 1_820_000, committed: 0 },
      { category: "Framing / Steel", budgeted: 3_200_000, spent: 3_010_000, committed: 280_000 },
      { category: "MEP", budgeted: 2_400_000, spent: 1_490_000, committed: 600_000 },
      { category: "Exterior", budgeted: 1_400_000, spent: 500_000, committed: 700_000 },
      { category: "Finishes", budgeted: 1_800_000, spent: 0, committed: 0 },
      { category: "Contingency", budgeted: 700_000, spent: 0, committed: 0 },
    ],
  },
  {
    id: "cp-2",
    name: "Northgate Industrial",
    address: "3200 Industrial Pkwy, Houston, TX",
    type: "Industrial / Warehouse",
    totalBudget: 5_800_000,
    spentToDate: 1_160_000,
    percentComplete: 20,
    startDate: "Oct 2024",
    targetCompletion: "Jun 2026",
    gcName: "Apex Build & Design",
    inspectionStatus: "scheduled",
    flags: [],
    milestones: [
      { id: "m8", label: "Site Clearing", dueDate: "Nov 2024", status: "complete", completedDate: "Nov 2024" },
      { id: "m9", label: "Utilities & Infrastructure", dueDate: "Jan 2025", status: "complete", completedDate: "Feb 2025" },
      { id: "m10", label: "Slab & Tilt-Up Panels", dueDate: "Apr 2025", status: "in-progress" },
      { id: "m11", label: "Structural Steel", dueDate: "Jul 2025", status: "upcoming" },
      { id: "m12", label: "Roof & Exterior", dueDate: "Oct 2025", status: "upcoming" },
      { id: "m13", label: "Dock Doors & Grade Levelers", dueDate: "Feb 2026", status: "upcoming" },
      { id: "m14", label: "Punch List & CO", dueDate: "Jun 2026", status: "upcoming" },
    ],
    budgetLines: [
      { category: "Site Work", budgeted: 620_000, spent: 600_000, committed: 20_000 },
      { category: "Foundation / Slab", budgeted: 1_100_000, spent: 480_000, committed: 440_000 },
      { category: "Structure & Roof", budgeted: 1_900_000, spent: 80_000, committed: 1_200_000 },
      { category: "MEP & Fire", budgeted: 900_000, spent: 0, committed: 200_000 },
      { category: "Dock Equipment", budgeted: 480_000, spent: 0, committed: 0 },
      { category: "Contingency", budgeted: 800_000, spent: 0, committed: 0 },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as DimensionValue, backgroundColor: color }]} />
    </View>
  );
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const colors = useColors();
  const color = STATUS_COLORS[milestone.status];
  const isComplete = milestone.status === "complete";
  const isDelayed = milestone.status === "delayed";

  return (
    <View style={[styles.milestoneRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.milestoneIcon, { backgroundColor: color + "20", borderColor: color + "40" }]}>
        <Feather name={isComplete ? "check" : isDelayed ? "alert-triangle" : "clock"} size={11} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.milestoneLabel, { color: isComplete ? colors.mutedForeground : colors.cream }]}>{milestone.label}</Text>
        <Text style={[styles.milestoneDue, { color: isDelayed ? "#ef4444" : colors.mutedForeground }]}>
          {isComplete && milestone.completedDate ? `Done ${milestone.completedDate}` : `Due ${milestone.dueDate}`}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: color + "15", borderColor: color + "30" }]}>
        <Text style={[styles.statusPillText, { color }]}>{milestone.status}</Text>
      </View>
    </View>
  );
}

function BudgetLines({ lines }: { lines: BudgetLine[] }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {lines.map((line, i) => {
        const pct = line.budgeted > 0 ? Math.round((line.spent / line.budgeted) * 100) : 0;
        return (
          <View key={i} style={[styles.budgetRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.budgetTop}>
                <Text style={[styles.budgetCategory, { color: colors.cream }]}>{line.category}</Text>
                <Text style={[styles.budgetPct, { color: pct > 100 ? "#ef4444" : colors.mutedForeground }]}>{pct}%</Text>
              </View>
              <ProgressBar pct={pct} color={pct > 100 ? "#ef4444" : pct > 85 ? "#fbbf24" : "#34d399"} />
              <View style={styles.budgetSubRow}>
                <Text style={[styles.budgetSub, { color: colors.mutedForeground }]}>Budget {fmt(line.budgeted)}</Text>
                <Text style={[styles.budgetSub, { color: colors.mutedForeground }]}>Spent {fmt(line.spent)}</Text>
                {line.committed > 0 && <Text style={[styles.budgetSub, { color: "#60a5fa" }]}>+{fmt(line.committed)} committed</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function mapApiToProjects(raw: unknown): ConstructionProject[] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const list = (r.data as Record<string, unknown>)?.projects ?? r.projects;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((p: Record<string, unknown>, idx: number) => ({
    id: String(p.id ?? idx),
    name: String(p.name ?? p.projectName ?? "Unknown Project"),
    property: String(p.property ?? ""),
    status: (["on-track", "at-risk", "delayed", "complete"].includes(String(p.status)) ? p.status : "on-track") as any,
    startDate: String(p.startDate ?? ""),
    expectedCompletion: String(p.expectedCompletion ?? p.completionDate ?? ""),
    totalBudget: Number(p.totalBudget ?? 0),
    spentToDate: Number(p.spentToDate ?? p.spent ?? 0),
    pctComplete: Number(p.pctComplete ?? p.percentComplete ?? 0),
    inspectionStatus: (["passed", "scheduled", "failed", "pending"].includes(String(p.inspectionStatus)) ? p.inspectionStatus : "pending") as ConstructionProject["inspectionStatus"],
    gcName: String(p.gcName ?? p.generalContractor ?? ""),
    milestones: Array.isArray(p.milestones)
      ? (p.milestones as Record<string, unknown>[]).map((m, mi) => ({
          id: String(m.id ?? mi),
          label: String(m.label ?? m.name ?? "Milestone"),
          targetDate: String(m.targetDate ?? m.date ?? ""),
          actualDate: m.actualDate != null ? String(m.actualDate) : undefined,
          status: (["complete", "in-progress", "upcoming", "delayed"].includes(String(m.status)) ? m.status : "upcoming") as Milestone["status"],
        }))
      : [],
    budgetLines: Array.isArray(p.budgetLines)
      ? (p.budgetLines as Record<string, unknown>[]).map((b, bi) => ({
          id: String(b.id ?? bi),
          category: String(b.category ?? "Other"),
          budgeted: Number(b.budgeted ?? 0),
          actual: Number(b.actual ?? 0),
        }))
      : [],
  })) as unknown as ConstructionProject[];
}

export default function ConstructionMonitorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<"milestones" | "budget">("milestones");

  const { data: apiData } = useQuery({
    queryKey: ["terra-construction"],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + "/terra/construction");
        if (!res.ok) return null;
        return res.json();
      } catch { return null; }
    },
    retry: 1,
  });

  const displayProjects: ConstructionProject[] = mapApiToProjects(apiData) ?? PROJECTS;
  const [selectedProject, setSelectedProject] = useState<string>(PROJECTS[0].id);

  const project = displayProjects.find(p => p.id === selectedProject) ?? displayProjects[0];
  const budgetPct = Math.round((project.spentToDate / project.totalBudget) * 100);
  const remaining = project.totalBudget - project.spentToDate;
  const inspColor = INSPECTION_COLORS[project.inspectionStatus];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,121,65,0.07)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: ACCENT + "cc" }]}>TERRA · CONSTRUCTION</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Project Monitor</Text>
        </View>
        {PROJECTS.reduce((acc, p) => acc + p.flags.length, 0) > 0 && (
          <View style={[styles.alertBadge, { backgroundColor: "#f59e0b" + "15", borderColor: "#f59e0b" + "40" }]}>
            <Feather name="flag" size={11} color="#f59e0b" />
            <Text style={[styles.alertText, { color: "#f59e0b" }]}>2 flags</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectTabs}>
        {displayProjects.map(p => (
          <Pressable
            key={p.id}
            onPress={() => { Haptics.selectionAsync(); setSelectedProject(p.id); }}
            style={[
              styles.projectTab,
              {
                borderColor: selectedProject === p.id ? ACCENT : colors.border,
                backgroundColor: selectedProject === p.id ? ACCENT + "12" : "transparent",
              },
            ]}
          >
            <Text style={[styles.projectTabText, { color: selectedProject === p.id ? ACCENT : colors.mutedForeground }]}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.projectCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.projectName, { color: colors.cream }]}>{project.name}</Text>
                <Text style={[styles.projectAddress, { color: colors.mutedForeground }]}>{project.address}</Text>
                <Text style={[styles.projectType, { color: ACCENT + "cc" }]}>{project.type}</Text>
              </View>
              <View style={[styles.inspBadge, { backgroundColor: inspColor + "15", borderColor: inspColor + "30" }]}>
                <Feather name="shield" size={11} color={inspColor} />
                <Text style={[styles.inspText, { color: inspColor }]}>{project.inspectionStatus}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Overall Progress</Text>
                <Text style={[styles.progressPct, { color: colors.cream }]}>{project.percentComplete}%</Text>
              </View>
              <ProgressBar pct={project.percentComplete} color="#60a5fa" />
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Budget Spent</Text>
                <Text style={[styles.progressPct, { color: budgetPct > 80 ? "#fbbf24" : colors.cream }]}>{budgetPct}%</Text>
              </View>
              <ProgressBar pct={budgetPct} color={budgetPct > 90 ? "#ef4444" : budgetPct > 75 ? "#fbbf24" : "#34d399"} />
            </View>

            <View style={styles.cardMetrics}>
              <View style={styles.cardMetric}>
                <Text style={[styles.cardMetricValue, { color: colors.cream }]}>{fmt(project.spentToDate)}</Text>
                <Text style={[styles.cardMetricLabel, { color: colors.mutedForeground }]}>Spent</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.cardMetric}>
                <Text style={[styles.cardMetricValue, { color: "#34d399" }]}>{fmt(remaining)}</Text>
                <Text style={[styles.cardMetricLabel, { color: colors.mutedForeground }]}>Remaining</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.cardMetric}>
                <Text style={[styles.cardMetricValue, { color: ACCENT }]}>{project.targetCompletion}</Text>
                <Text style={[styles.cardMetricLabel, { color: colors.mutedForeground }]}>Target CO</Text>
              </View>
            </View>

            {project.flags.length > 0 && (
              <View style={[styles.flagsBox, { backgroundColor: "#f59e0b" + "08", borderColor: "#f59e0b" + "25" }]}>
                {project.flags.map((flag, i) => (
                  <View key={i} style={styles.flagItem}>
                    <Feather name="flag" size={10} color="#f59e0b" />
                    <Text style={[styles.flagText, { color: "#f59e0b" }]}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.gcLabel, { color: colors.mutedForeground }]}>GC: {project.gcName} · {project.startDate} → {project.targetCompletion}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(["milestones", "budget"] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
              style={[
                styles.tab,
                { borderColor: activeTab === tab ? ACCENT : "transparent", borderBottomWidth: 2 },
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? ACCENT : colors.mutedForeground }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "milestones" && (
          <View style={{ paddingHorizontal: 16 }}>
            {project.milestones.map(m => <MilestoneRow key={m.id} milestone={m} />)}
          </View>
        )}

        {activeTab === "budget" && (
          <BudgetLines lines={project.budgetLines} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  backBtn: { padding: 4, marginTop: 14 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 3 },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  alertText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  projectTabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  projectTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  projectTabText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  projectCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  projectCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  projectName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  projectAddress: { fontSize: 11, fontFamily: "Inter_300Light", marginBottom: 3 },
  projectType: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  inspBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  inspText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  progressSection: { marginBottom: 10 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  progressLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  progressPct: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  cardMetrics: { flexDirection: "row", alignItems: "center", paddingTop: 10, marginTop: 4 },
  cardMetric: { flex: 1, alignItems: "center" },
  cardMetricValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardMetricLabel: { fontSize: 9, fontFamily: "Inter_300Light", letterSpacing: 0.5 },
  metricDivider: { width: 1, height: 28 },
  flagsBox: { marginTop: 12, borderRadius: 8, borderWidth: 1, padding: 10, gap: 6 },
  flagItem: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  flagText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  gcLabel: { fontSize: 10, fontFamily: "Inter_300Light", marginTop: 10 },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  milestoneIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  milestoneLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  milestoneDue: { fontSize: 10, fontFamily: "Inter_300Light" },
  statusPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  statusPillText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  budgetRow: { paddingVertical: 12, borderBottomWidth: 1 },
  budgetTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  budgetCategory: { fontSize: 12, fontFamily: "Inter_500Medium" },
  budgetPct: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  budgetSubRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  budgetSub: { fontSize: 10, fontFamily: "Inter_300Light" },
});
