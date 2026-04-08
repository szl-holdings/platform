import { type ReactNode } from "react";
import { useFeatureFlag } from "./hooks";

export interface FeatureFlagGateProps {
  flagKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureFlagGate({ flagKey, children, fallback = null }: FeatureFlagGateProps) {
  const isEnabled = useFeatureFlag(flagKey);
  return <>{isEnabled ? children : fallback}</>;
}
