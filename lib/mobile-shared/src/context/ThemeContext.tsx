import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  resolved: 'dark',
  isDark: true,
  setMode: () => {},
  toggle: () => {},
});

function resolveScheme(mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedTheme {
  if (mode === 'system') return systemScheme === 'light' ? 'light' : 'dark';
  return mode;
}

async function readStorage(key: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem(key);
  } catch {
    return null;
  }
}

async function writeStorage(key: string, value: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    await AS.setItem(key, value);
  } catch {}
}

function isThemeMode(v: string): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system';
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({ children, defaultMode = 'dark', storageKey }: ThemeProviderProps) {
  const systemScheme = Appearance.getColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [hydrated, setHydrated] = useState(!storageKey);
  const [systemResolve, setSystemResolve] = useState<ColorSchemeName>(systemScheme);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemResolve(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    readStorage(storageKey).then((stored) => {
      if (stored && isThemeMode(stored)) {
        setModeState(stored);
      }
      setHydrated(true);
    });
  }, [storageKey]);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      if (storageKey) {
        writeStorage(storageKey, newMode);
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark';
      if (storageKey) {
        writeStorage(storageKey, next);
      }
      return next;
    });
  }, [storageKey]);

  const resolved = resolveScheme(mode, systemResolve);
  const isDark = resolved === 'dark';

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={{ mode, resolved, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
