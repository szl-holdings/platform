import v8 from "v8";

function computeHeapLimitMb(): number {
  const { heap_size_limit } = v8.getHeapStatistics();
  return Math.round(heap_size_limit / 1024 / 1024);
}

export const HEAP_LIMIT_MB = computeHeapLimitMb();

export const HEAP_GC_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.52);
export const HEAP_WARN_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.72);
export const HEAP_CRITICAL_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.88);
