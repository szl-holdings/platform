import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Message } from "./AICopilot";

export interface PersistentThread {
  threadId: string;
  agentId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const THREADS_KEY = "ai_copilot_threads";
const MESSAGE_KEY_PREFIX = "ai_copilot_messages_";
const MAX_THREADS = 50;
const MAX_MESSAGES_PER_THREAD = 200;

function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromMessage(content: string): string {
  const truncated = content.trim().replace(/\s+/g, " ").slice(0, 50);
  return truncated.length < content.trim().length ? truncated + "…" : truncated;
}

export function usePersistentThreads(agentId: string) {
  const [threads, setThreads] = useState<PersistentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  useEffect(() => {
    loadThreads();
  }, [agentId]);

  async function loadThreads(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(THREADS_KEY);
      if (!raw) {
        setLoadingThreads(false);
        return;
      }
      const all: PersistentThread[] = JSON.parse(raw);
      const filtered = all
        .filter(t => t.agentId === agentId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setThreads(filtered);
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }

  async function createThread(firstMessage?: string): Promise<string> {
    const threadId = generateThreadId();
    const now = new Date().toISOString();
    const thread: PersistentThread = {
      threadId,
      agentId,
      title: firstMessage ? titleFromMessage(firstMessage) : "New Conversation",
      lastMessage: firstMessage ?? "",
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const raw = await AsyncStorage.getItem(THREADS_KEY);
      const all: PersistentThread[] = raw ? JSON.parse(raw) : [];
      const updated = [thread, ...all].slice(0, MAX_THREADS);
      await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(updated));
      setThreads(prev => [thread, ...prev].slice(0, MAX_THREADS));
    } catch { }

    setActiveThreadId(threadId);
    setMessages([]);
    return threadId;
  }

  async function loadThread(threadId: string): Promise<void> {
    setActiveThreadId(threadId);
    try {
      const raw = await AsyncStorage.getItem(`${MESSAGE_KEY_PREFIX}${threadId}`);
      if (raw) {
        const storedMessages: Message[] = JSON.parse(raw);
        const hydrated = storedMessages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(hydrated);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }

  const persistMessage = useCallback(async (threadId: string, message: Message): Promise<void> => {
    try {
      const key = `${MESSAGE_KEY_PREFIX}${threadId}`;
      const raw = await AsyncStorage.getItem(key);
      const existing: Message[] = raw ? JSON.parse(raw) : [];
      const found = existing.findIndex(m => m.id === message.id);
      if (found >= 0) {
        existing[found] = message;
      } else {
        existing.push(message);
      }
      const trimmed = existing.slice(-MAX_MESSAGES_PER_THREAD);
      await AsyncStorage.setItem(key, JSON.stringify(trimmed));

      const threadsRaw = await AsyncStorage.getItem(THREADS_KEY);
      if (threadsRaw) {
        const allThreads: PersistentThread[] = JSON.parse(threadsRaw);
        const idx = allThreads.findIndex(t => t.threadId === threadId);
        if (idx >= 0) {
          allThreads[idx] = {
            ...allThreads[idx]!,
            lastMessage: message.content.slice(0, 80),
            messageCount: trimmed.length,
            updatedAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(allThreads));
          setThreads(allThreads.filter(t => t.agentId === agentId).sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ));
        }
      }
    } catch { }
  }, [agentId]);

  async function deleteThread(threadId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${MESSAGE_KEY_PREFIX}${threadId}`);
      const raw = await AsyncStorage.getItem(THREADS_KEY);
      if (raw) {
        const all: PersistentThread[] = JSON.parse(raw);
        const updated = all.filter(t => t.threadId !== threadId);
        await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(updated));
        setThreads(updated.filter(t => t.agentId === agentId));
      }
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch { }
  }

  return {
    threads,
    activeThreadId,
    messages,
    setMessages,
    loadingThreads,
    createThread,
    loadThread,
    persistMessage,
    deleteThread,
  };
}
