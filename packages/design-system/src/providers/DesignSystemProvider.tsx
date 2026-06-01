import { createContext, type ReactNode, useContext, useState } from 'react';
import type { DensityMode } from '../tokens/index.js';

export type ScreenMode = 'executive' | 'operator';

export interface DesignSystemContextValue {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  screenMode: ScreenMode;
  setScreenMode: (mode: ScreenMode) => void;
}

const DesignSystemContext = createContext<DesignSystemContextValue>({
  density: 'comfortable',
  setDensity: () => void 0,
  screenMode: 'executive',
  setScreenMode: () => void 0,
});

export interface DesignSystemProviderProps {
  defaultDensity?: DensityMode;
  defaultScreenMode?: ScreenMode;
  children: ReactNode;
}

/**
 * DesignSystemProvider
 *
 * Provides density mode and screen mode (executive/operator) context to all child components.
 * Mount once at the root of each artifact.
 *
 * @example
 * <DesignSystemProvider defaultDensity="compact" defaultScreenMode="operator">
 *   <App />
 * </DesignSystemProvider>
 */
export function DesignSystemProvider({
  defaultDensity = 'comfortable',
  defaultScreenMode = 'executive',
  children,
}: DesignSystemProviderProps) {
  const [density, setDensity] = useState<DensityMode>(defaultDensity);
  const [screenMode, setScreenMode] = useState<ScreenMode>(defaultScreenMode);

  return (
    <DesignSystemContext.Provider value={{ density, setDensity, screenMode, setScreenMode }}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem(): DesignSystemContextValue {
  return useContext(DesignSystemContext);
}
