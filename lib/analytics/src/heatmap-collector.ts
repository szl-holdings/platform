export interface HeatmapCollectorOptions {
  sessionId?: string;
  apiBaseUrl?: string;
  enabled?: boolean;
  throttleMs?: number;
}

interface HeatmapEvent {
  sessionId?: string;
  pagePath: string;
  eventType: "click" | "move" | "scroll";
  x?: number;
  y?: number;
  xPct?: number;
  yPct?: number;
  scrollDepthPct?: number;
  elementTag?: string;
  elementClass?: string;
  elementText?: string;
  viewportWidth?: number;
  viewportHeight?: number;
}

const MOVE_THROTTLE_MS = 100;
const FLUSH_INTERVAL_MS = 8_000;
const BATCH_SIZE = 30;

let _events: HeatmapEvent[] = [];
let _listeners: Array<() => void> = [];
let _flushInterval: ReturnType<typeof setInterval> | null = null;
let _lastMoveTime = 0;
let _opts: HeatmapCollectorOptions | null = null;

function getPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

function getViewport(): { w: number; h: number } {
  return {
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  };
}

function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 1000) / 10;
}

async function flush(): Promise<void> {
  if (_events.length === 0 || !_opts) return;
  const batch = _events.splice(0, BATCH_SIZE);
  try {
    const baseUrl = _opts.apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    await fetch(`${baseUrl}/api/analytics/heatmap-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    _events.unshift(...batch);
  }
}

function onClickHandler(e: MouseEvent): void {
  if (!_opts?.enabled) return;
  const vp = getViewport();
  const target = e.target as HTMLElement | null;
  const ev: HeatmapEvent = {
    sessionId: _opts.sessionId,
    pagePath: getPath(),
    eventType: "click",
    x: Math.round(e.clientX),
    y: Math.round(e.clientY + window.scrollY),
    xPct: pct(e.clientX, vp.w),
    yPct: pct(e.clientY + window.scrollY, document.documentElement.scrollHeight),
    elementTag: target?.tagName?.toLowerCase(),
    elementClass: target?.className?.toString()?.substring(0, 80),
    elementText: target?.textContent?.trim()?.substring(0, 60),
    viewportWidth: vp.w,
    viewportHeight: vp.h,
  };
  _events.push(ev);
  if (_events.length >= BATCH_SIZE) flush();
}

function onMoveHandler(e: MouseEvent): void {
  if (!_opts?.enabled) return;
  const now = Date.now();
  if (now - _lastMoveTime < MOVE_THROTTLE_MS) return;
  _lastMoveTime = now;
  const vp = getViewport();
  _events.push({
    sessionId: _opts.sessionId,
    pagePath: getPath(),
    eventType: "move",
    x: Math.round(e.clientX),
    y: Math.round(e.clientY + window.scrollY),
    xPct: pct(e.clientX, vp.w),
    yPct: pct(e.clientY + window.scrollY, document.documentElement.scrollHeight),
    viewportWidth: vp.w,
    viewportHeight: vp.h,
  });
}

let _lastScrollPct = 0;
function onScrollHandler(): void {
  if (!_opts?.enabled) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;
  const scrollPct = Math.round((scrollTop / docHeight) * 100);
  if (Math.abs(scrollPct - _lastScrollPct) < 5) return;
  _lastScrollPct = scrollPct;
  _events.push({
    sessionId: _opts.sessionId,
    pagePath: getPath(),
    eventType: "scroll",
    scrollDepthPct: scrollPct,
    viewportWidth: getViewport().w,
    viewportHeight: getViewport().h,
  });
}

export function initHeatmapCollector(opts: HeatmapCollectorOptions): () => void {
  if (typeof window === "undefined" || !opts.enabled) return () => {};

  _opts = opts;

  const clickH = onClickHandler as EventListener;
  const moveH = onMoveHandler as EventListener;
  const scrollH = onScrollHandler as EventListener;

  window.addEventListener("click", clickH, { passive: true });
  window.addEventListener("mousemove", moveH, { passive: true });
  window.addEventListener("scroll", scrollH, { passive: true });

  _flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

  const stop = () => {
    window.removeEventListener("click", clickH);
    window.removeEventListener("mousemove", moveH);
    window.removeEventListener("scroll", scrollH);
    if (_flushInterval) { clearInterval(_flushInterval); _flushInterval = null; }
    flush();
    _opts = null;
  };

  _listeners.push(stop);
  return stop;
}
