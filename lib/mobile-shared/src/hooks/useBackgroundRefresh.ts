import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

export interface BackgroundRefreshTask {
  key: string;
  intervalMs: number;
  handler: () => Promise<void>;
}

export interface UseBackgroundRefreshOptions {
  tasks: BackgroundRefreshTask[];
  enabled?: boolean;
  refreshOnForeground?: boolean;
}

export function useBackgroundRefresh(options: UseBackgroundRefreshOptions): void {
  const { tasks, enabled = true, refreshOnForeground = true } = options;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const lastRunRef = useRef<Record<string, number>>({});
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const runDueTasks = useCallback(async () => {
    const now = Date.now();
    for (const task of tasksRef.current) {
      const lastRun = lastRunRef.current[task.key] ?? 0;
      if (now - lastRun >= task.intervalMs) {
        lastRunRef.current[task.key] = now;
        try {
          await task.handler();
        } catch (err) {
          console.warn(`[BackgroundRefresh] Task ${task.key} failed:`, err);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    for (const task of tasks) {
      const interval = setInterval(async () => {
        lastRunRef.current[task.key] = Date.now();
        try {
          await task.handler();
        } catch (err) {
          console.warn(`[BackgroundRefresh] Task ${task.key} failed:`, err);
        }
      }, task.intervalMs);
      intervalsRef.current.push(interval);
    }

    let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
    if (refreshOnForeground) {
      appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          runDueTasks();
        }
      });
    }

    return () => {
      for (const interval of intervalsRef.current) {
        clearInterval(interval);
      }
      intervalsRef.current = [];
      appStateSub?.remove();
    };
  }, [enabled, refreshOnForeground, runDueTasks, tasks]);
}
