/**
 * useRankChangePush — fires local push notifications when a followed agent
 * changes rank on a leaderboard benchmark the user is subscribed to.
 *
 * Gated by the user's push preference stored in AsyncStorage:
 *   key: 'rankChangePushEnabled'  value: 'true' | 'false'
 *
 * Suppression semantics (both lists are required for any notification):
 *   followedAgentIds — reads from AsyncStorage each cycle; empty → suppress all.
 *   subscribedBenchmarkIds — reads from AsyncStorage each cycle; empty → suppress all.
 *
 * Polls the public eval registry endpoint every POLL_INTERVAL_MS and compares
 * ranks against a local snapshot. On rank change it schedules a local
 * notification via expo-notifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { registerForPushNotificationsAsync } from '@/hooks/usePushNotifications';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const PREF_KEY = 'rankChangePushEnabled';
const SNAPSHOT_KEY = 'rankSnapshot';
const FOLLOWED_AGENTS_KEY = 'followedAgentIds';
const SUBSCRIBED_BENCHMARKS_KEY = 'subscribedBenchmarkIds';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface RankSnapshot {
  [key: string]: number;
}

interface LeaderboardResult {
  entityId: string;
  rank: number;
  benchmark: string;
  task: string;
}

async function fetchRanks(
  agentIds: string[],
  subscribedBenchmarkIds: string[],
): Promise<LeaderboardResult[]> {
  try {
    const bmData = await apiFetch<{
      benchmarks?: Array<{ benchmarkId: string; tasks?: Array<{ taskId: string }> }>;
    }>('/api/eval-registry/public/benchmarks');
    const allBenchmarks = bmData?.benchmarks ?? [];
    const targetBenchmarks = allBenchmarks.filter((b) =>
      subscribedBenchmarkIds.includes(b.benchmarkId),
    );

    if (targetBenchmarks.length === 0) return [];

    const results: LeaderboardResult[] = [];
    const agentSet = new Set(agentIds);

    await Promise.all(
      targetBenchmarks.flatMap((b) =>
        (b.tasks ?? []).map(async (t) => {
          try {
            const lb = await apiFetch<{
              entries?: Array<{ entityId: string; rank: number }>;
            }>(
              `/api/eval-registry/public/benchmarks/${b.benchmarkId}/leaderboard?task_id=${t.taskId}&limit=50`,
            );
            for (const entry of lb?.entries ?? []) {
              if (agentSet.has(entry.entityId)) {
                results.push({
                  entityId: entry.entityId,
                  rank: entry.rank,
                  benchmark: b.benchmarkId,
                  task: t.taskId,
                });
              }
            }
          } catch {}
        }),
      ),
    );

    return results;
  } catch {
    return [];
  }
}

async function loadSnapshot(): Promise<RankSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as RankSnapshot) : {};
  } catch {
    return {};
  }
}

async function saveSnapshot(snapshot: RankSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
}

async function isPushEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PREF_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

async function scheduleRankChangeNotification(
  agentId: string,
  benchmark: string,
  oldRank: number,
  newRank: number,
): Promise<void> {
  const direction = newRank < oldRank ? 'moved up' : 'moved down';
  const emoji = newRank < oldRank ? '⬆️' : '⬇️';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Rank change — ${agentId}`,
      body: `${agentId} ${direction} to #${newRank} on ${benchmark}`,
      data: { agentId, benchmark, oldRank, newRank },
    },
    trigger: null,
  });
}

/**
 * Mount once at app-shell level. Reads followedAgentIds and subscribedBenchmarkIds
 * from AsyncStorage on every poll cycle. Either list being empty suppresses all
 * notifications — the user must have explicit follows and subscriptions.
 */
export function useRankChangePush() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const enabled = await isPushEnabled();
    if (!enabled) return;

    const [followedRaw, subscribedRaw] = await Promise.all([
      AsyncStorage.getItem(FOLLOWED_AGENTS_KEY).catch(() => null),
      AsyncStorage.getItem(SUBSCRIBED_BENCHMARKS_KEY).catch(() => null),
    ]);

    const followedAgentIds: string[] = followedRaw ? (JSON.parse(followedRaw) as string[]) : [];
    const subscribedBenchmarkIds: string[] = subscribedRaw
      ? (JSON.parse(subscribedRaw) as string[])
      : [];

    // Require explicit opt-in on both dimensions.
    if (followedAgentIds.length === 0 || subscribedBenchmarkIds.length === 0) return;

    const token = await registerForPushNotificationsAsync().catch(() => null);
    if (!token) return;

    const results = await fetchRanks(followedAgentIds, subscribedBenchmarkIds);
    if (results.length === 0) return;

    const snapshot = await loadSnapshot();
    const nextSnapshot: RankSnapshot = { ...snapshot };
    let changed = false;

    for (const result of results) {
      const key = `${result.entityId}::${result.benchmark}::${result.task}`;
      const oldRank = snapshot[key];
      const newRank = result.rank;

      if (oldRank !== undefined && oldRank !== newRank) {
        await scheduleRankChangeNotification(
          result.entityId,
          result.benchmark,
          oldRank,
          newRank,
        ).catch(() => {});
      }

      nextSnapshot[key] = newRank;
      changed = true;
    }

    if (changed) {
      await saveSnapshot(nextSnapshot);
    }
  }, []);

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);
}

export async function setRankChangePushEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
}

export async function getRankChangePushEnabled(): Promise<boolean> {
  return isPushEnabled();
}

export async function getFollowedAgentIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FOLLOWED_AGENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function toggleFollowedAgent(agentId: string): Promise<boolean> {
  const current = await getFollowedAgentIds();
  const isFollowed = current.includes(agentId);
  const updated = isFollowed ? current.filter((id) => id !== agentId) : [...current, agentId];
  await AsyncStorage.setItem(FOLLOWED_AGENTS_KEY, JSON.stringify(updated));
  return !isFollowed;
}

export async function getSubscribedBenchmarkIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIBED_BENCHMARKS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
