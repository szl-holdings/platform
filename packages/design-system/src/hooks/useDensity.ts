import { useDesignSystem } from '../providers/DesignSystemProvider.js';
import { type DensityMode, densityConfig } from '../tokens/index.js';

export interface DensityValues {
  mode: DensityMode;
  pagePadding: string;
  sectionGap: string;
  cardPadding: string;
  rowHeight: string;
  inputHeight: string;
  iconSize: string;
  fontSize: string;
  setDensity: (mode: DensityMode) => void;
}

/**
 * Returns the current density configuration values and a setter.
 * Use in components that need to adapt to density mode.
 */
export function useDensity(): DensityValues {
  const { density, setDensity } = useDesignSystem();
  const config = densityConfig[density];
  return { mode: density, ...config, setDensity };
}
