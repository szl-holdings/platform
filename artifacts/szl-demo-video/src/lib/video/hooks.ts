// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
  totalElapsedMs: number;
  sceneElapsedMs: number;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0);

  const sceneStartRef = useRef(Date.now());
  const globalStartRef = useRef(Date.now());
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
    globalStartRef.current = Date.now();
  }, []);

  // Track elapsed time within current scene and total
  useEffect(() => {
    sceneStartRef.current = Date.now();
    const id = setInterval(() => {
      setSceneElapsedMs(Date.now() - sceneStartRef.current);
      setTotalElapsedMs(Date.now() - globalStartRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [currentScene]);

  // Scene advancement -- loops independently of recording
  useEffect(() => {
    if (hasEnded && !loop) return;

    const currentDuration = durationsArray[currentScene];

    const timer = setTimeout(() => {
      // Last scene just finished playing
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
          globalStartRef.current = Date.now();
        }
      } else {
        setCurrentScene((prev) => prev + 1);
      }
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
    totalElapsedMs,
    sceneElapsedMs,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map((e) => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
