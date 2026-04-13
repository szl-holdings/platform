export interface SessionRecorderOptions {
  sessionId: string;
  apiBaseUrl?: string;
  sampleRate?: number;
  conversionSampleRate?: number;
  onConversion?: () => void;
  enabled?: boolean;
}

type RRWebEvent = Record<string, unknown>;

const PII_INPUT_TYPES = ["password", "email", "tel", "credit-card", "ssn", "text"];
const MAX_CHUNK_SIZE = 50;
const FLUSH_INTERVAL_MS = 5_000;
const MAX_RECORDING_BYTES = 5 * 1024 * 1024;

let _stopFn: (() => void) | null = null;
let _recordingId: number | null = null;
let _chunkBuffer: RRWebEvent[] = [];
let _sequence = 0;
let _totalSizeBytes = 0;
let _flushInterval: ReturnType<typeof setInterval> | null = null;
let _options: SessionRecorderOptions | null = null;

function maskPII(event: RRWebEvent): RRWebEvent {
  try {
    const str = JSON.stringify(event);
    const masked = str
      .replace(/"value":"[^"]{1,}"(,"inputType":"(password|email|tel)")/g, '"value":"***"$1')
      .replace(/("type":"input","data":\{[^}]*"value":)"[^"]*"/g, '$1"***"');
    return JSON.parse(masked);
  } catch {
    return event;
  }
}

function estimateBytes(events: RRWebEvent[]): number {
  try {
    return JSON.stringify(events).length * 2;
  } catch {
    return 0;
  }
}

async function createRecording(opts: SessionRecorderOptions): Promise<number | null> {
  try {
    const baseUrl = opts.apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const res = await fetch(`${baseUrl}/api/analytics/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: opts.sessionId }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { id: number };
    return data.id;
  } catch {
    return null;
  }
}

async function flushChunk(events: RRWebEvent[], sequence: number): Promise<void> {
  if (!_recordingId || events.length === 0) return;
  const opts = _options;
  if (!opts) return;
  try {
    const baseUrl = opts.apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    await fetch(`${baseUrl}/api/analytics/recordings/${_recordingId}/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence, events }),
    });
  } catch {
  }
}

async function flush(): Promise<void> {
  if (_chunkBuffer.length === 0) return;
  const events = _chunkBuffer.splice(0, _chunkBuffer.length);
  const masked = events.map(maskPII);
  const bytes = estimateBytes(masked);
  _totalSizeBytes += bytes;
  if (_totalSizeBytes > MAX_RECORDING_BYTES) {
    stop();
    return;
  }
  await flushChunk(masked, _sequence++);
}

function shouldRecord(sampleRate: number): boolean {
  return Math.random() * 100 < sampleRate;
}

export async function start(opts: SessionRecorderOptions): Promise<void> {
  if (typeof window === "undefined") return;
  if (!opts.enabled) return;

  const effectiveSampleRate = opts.sampleRate ?? 10;
  if (!shouldRecord(effectiveSampleRate)) return;

  _options = opts;
  _recordingId = await createRecording(opts);
  if (!_recordingId) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rrweb = await (Function('return import("rrweb")')() as Promise<any>);
    const record = rrweb?.record ?? rrweb?.default?.record;
    if (!record) { return; }
    _stopFn = record({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emit(event: any) {
        const masked = maskPII(event as RRWebEvent);
        _chunkBuffer.push(masked);
        if (_chunkBuffer.length >= MAX_CHUNK_SIZE) {
          flush();
        }
      },
      maskAllInputs: true,
      maskTextSelector: '[data-pii], [data-mask], input[type="password"], input[type="email"]',
      blockClass: "rr-block",
      ignoreClass: "rr-ignore",
      checkoutEveryNms: 10_000,
    });

    _flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

    window.addEventListener("beforeunload", () => {
      flush();
      stop();
    });
  } catch {
  }
}

export function stop(): void {
  if (_stopFn) {
    _stopFn();
    _stopFn = null;
  }
  if (_flushInterval) {
    clearInterval(_flushInterval);
    _flushInterval = null;
  }
  _chunkBuffer = [];
  _sequence = 0;
  _totalSizeBytes = 0;
  _recordingId = null;
  _options = null;
}

export function markConversion(event: string): void {
  if (!_options) return;
  const opts = _options;
  const baseUrl = opts.apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  if (_recordingId) {
    fetch(`${baseUrl}/api/analytics/recordings/${_recordingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ didConvert: true, conversionEvent: event }),
    }).catch(() => {});
  }
}

export function isRecording(): boolean {
  return _recordingId !== null;
}
