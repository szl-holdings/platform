import { useState, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";

const VAULT_KEY_PREFIX = "szl_vault_key_";
const VAULT_MESSAGES_PREFIX = "szl_vault_msgs_";

export interface VaultMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface UseSecureVaultReturn {
  isVaultMode: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  vaultMessages: VaultMessage[];
  enterVaultMode: () => Promise<boolean>;
  exitVaultMode: () => void;
  addVaultMessage: (msg: VaultMessage) => Promise<void>;
  clearVault: () => Promise<void>;
  tapCount: number;
  handleTap: () => void;
}

async function biometricAuthenticate(reason: string): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Use PIN",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++] ?? 0;
    const b1 = bytes[i++] ?? 0;
    const b2 = bytes[i++] ?? 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i - 2 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i - 1 < bytes.length ? chars[b2 & 63] : "=";
  }
  return result;
}

function base64ToUint8(b64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const cleaned = b64.replace(/=/g, "");
  const outLen = Math.floor((cleaned.length * 3) / 4);
  const out = new Uint8Array(outLen);
  let idx = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const c0 = lookup[cleaned.charCodeAt(i)] ?? 0;
    const c1 = lookup[cleaned.charCodeAt(i + 1)] ?? 0;
    const c2 = lookup[cleaned.charCodeAt(i + 2)] ?? 0;
    const c3 = lookup[cleaned.charCodeAt(i + 3)] ?? 0;
    out[idx++] = (c0 << 2) | (c1 >> 4);
    if (i + 2 < cleaned.length) out[idx++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (i + 3 < cleaned.length) out[idx++] = ((c2 & 3) << 6) | c3;
  }
  return out;
}

function hasCryptoSubtle(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function getOrCreateVaultKey(appId: string): Promise<string> {
  const keyId = `${VAULT_KEY_PREFIX}${appId}`;
  let keyHex = await SecureStore.getItemAsync(keyId, {
    requireAuthentication: false,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!keyHex) {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    keyHex = bytesToHex(randomBytes);
    await SecureStore.setItemAsync(keyId, keyHex, {
      requireAuthentication: false,
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return keyHex;
}

async function importAesKey(keyHex: string): Promise<CryptoKey> {
  if (!hasCryptoSubtle()) {
    throw new Error("AES-GCM encryption unavailable: crypto.subtle not present");
  }
  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptMessages(messages: VaultMessage[], keyHex: string): Promise<string> {
  if (!hasCryptoSubtle()) {
    throw new Error("Cannot encrypt vault: crypto.subtle unavailable on this platform");
  }
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(messages));
  const ivBytes = await Crypto.getRandomBytesAsync(12);
  const cryptoKey = await importAesKey(keyHex);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ivBytes) },
    cryptoKey,
    toArrayBuffer(plaintextBytes),
  );
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  return `${uint8ToBase64(ivBytes)}:${uint8ToBase64(ciphertextBytes)}`;
}

async function decryptMessages(stored: string, keyHex: string): Promise<VaultMessage[]> {
  if (!hasCryptoSubtle()) {
    throw new Error("Cannot decrypt vault: crypto.subtle unavailable on this platform");
  }
  const colonIdx = stored.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid vault ciphertext format");
  const ivBytes = base64ToUint8(stored.slice(0, colonIdx));
  const ciphertextBytes = base64ToUint8(stored.slice(colonIdx + 1));
  const cryptoKey = await importAesKey(keyHex);
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ivBytes) },
    cryptoKey,
    toArrayBuffer(ciphertextBytes),
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintextBuffer)) as VaultMessage[];
}

export function useSecureVault(appId: string): UseSecureVaultReturn {
  const [isVaultMode, setIsVaultMode] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vaultMessages, setVaultMessages] = useState<VaultMessage[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vaultKey = useRef<string | null>(null);

  const handleTap = useCallback(() => {
    setTapCount(prev => {
      const next = prev + 1;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setTapCount(0), 1500);
      return next;
    });
  }, []);

  const loadVaultMessages = useCallback(async (key: string): Promise<VaultMessage[]> => {
    const msgsKey = `${VAULT_MESSAGES_PREFIX}${appId}`;
    const raw = await SecureStore.getItemAsync(msgsKey, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!raw) return [];
    return decryptMessages(raw, key);
  }, [appId]);

  const enterVaultMode = useCallback(async (): Promise<boolean> => {
    if (!hasCryptoSubtle()) {
      throw new Error("Vault unavailable: AES-GCM encryption is not supported on this device");
    }
    const authed = await biometricAuthenticate("Authenticate to access Encrypted Vault");
    if (!authed) return false;
    const key = await getOrCreateVaultKey(appId);
    vaultKey.current = key;
    const msgs = await loadVaultMessages(key);
    setVaultMessages(msgs);
    setIsAuthenticated(true);
    setIsLocked(false);
    setIsVaultMode(true);
    setTapCount(0);
    return true;
  }, [appId, loadVaultMessages]);

  const exitVaultMode = useCallback(() => {
    setIsVaultMode(false);
    setIsAuthenticated(false);
    setIsLocked(true);
    setVaultMessages([]);
    vaultKey.current = null;
  }, []);

  const addVaultMessage = useCallback(async (msg: VaultMessage) => {
    if (!vaultKey.current) throw new Error("Vault is locked — authenticate first");
    const updated = [...vaultMessages, msg];
    setVaultMessages(updated);
    const encrypted = await encryptMessages(updated, vaultKey.current);
    const msgsKey = `${VAULT_MESSAGES_PREFIX}${appId}`;
    await SecureStore.setItemAsync(msgsKey, encrypted, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }, [appId, vaultMessages]);

  const clearVault = useCallback(async () => {
    const authed = await biometricAuthenticate("Authenticate to clear vault data");
    if (!authed) return;
    const msgsKey = `${VAULT_MESSAGES_PREFIX}${appId}`;
    const keyId = `${VAULT_KEY_PREFIX}${appId}`;
    await SecureStore.deleteItemAsync(msgsKey);
    await SecureStore.deleteItemAsync(keyId);
    setVaultMessages([]);
    vaultKey.current = null;
    exitVaultMode();
  }, [appId, exitVaultMode]);

  return {
    isVaultMode,
    isLocked,
    isAuthenticated,
    vaultMessages,
    enterVaultMode,
    exitVaultMode,
    addVaultMessage,
    clearVault,
    tapCount,
    handleTap,
  };
}
