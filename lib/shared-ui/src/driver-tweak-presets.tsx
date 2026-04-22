import { Bookmark, Check, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface DriverTweak {
  meanMultiplier: number;
  spreadMultiplier: number;
}

const IDENTITY_TWEAK: DriverTweak = { meanMultiplier: 1, spreadMultiplier: 1 };

function isIdentityTweak(t: DriverTweak | undefined): boolean {
  if (!t) return true;
  return Math.abs(t.meanMultiplier - 1) < 1e-9 && Math.abs(t.spreadMultiplier - 1) < 1e-9;
}

export interface DriverTweakPreset {
  id: string;
  name: string;
  savedAt: number;
  tweaks: Record<string, DriverTweak>;
}

const STORAGE_PREFIX = 'szl:driver-tweak-presets:';

function storageKey(scopeKey: string): string {
  return `${STORAGE_PREFIX}${scopeKey}`;
}

function isDriverTweak(value: unknown): value is DriverTweak {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.meanMultiplier === 'number' && typeof v.spreadMultiplier === 'number';
}

function readPresets(scopeKey: string): DriverTweakPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(scopeKey));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: DriverTweakPreset[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const p = item as Record<string, unknown>;
      if (typeof p.id !== 'string' || typeof p.name !== 'string') continue;
      if (typeof p.savedAt !== 'number') continue;
      if (!p.tweaks || typeof p.tweaks !== 'object') continue;
      const tweaks: Record<string, DriverTweak> = {};
      for (const [k, v] of Object.entries(p.tweaks as Record<string, unknown>)) {
        if (isDriverTweak(v)) tweaks[k] = v;
      }
      out.push({ id: p.id, name: p.name, savedAt: p.savedAt, tweaks });
    }
    return out;
  } catch {
    return [];
  }
}

function writePresets(scopeKey: string, presets: DriverTweakPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(presets));
  } catch {
    /* quota or unavailable — ignore */
  }
}

export interface DriverTweakPresetsProps {
  scopeKey: string;
  accentColor: string;
  currentTweaks: Record<string, DriverTweak>;
  onLoad: (tweaks: Record<string, DriverTweak>) => void;
}

export function DriverTweakPresets({
  scopeKey,
  accentColor,
  currentTweaks,
  onLoad,
}: DriverTweakPresetsProps) {
  const [presets, setPresets] = useState<DriverTweakPreset[]>(() => readPresets(scopeKey));
  const [name, setName] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [justSaved, setJustSaved] = useState<boolean>(false);

  useEffect(() => {
    setPresets(readPresets(scopeKey));
    setSelectedId('');
    setName('');
  }, [scopeKey]);

  const hasOverrides = useMemo(() => {
    return Object.values(currentTweaks).some((t) => !isIdentityTweak(t));
  }, [currentTweaks]);

  const persist = useCallback(
    (next: DriverTweakPreset[]) => {
      setPresets(next);
      writePresets(scopeKey, next);
    },
    [scopeKey],
  );

  const savePreset = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const sanitized: Record<string, DriverTweak> = {};
    for (const [id, t] of Object.entries(currentTweaks)) {
      if (!isIdentityTweak(t)) sanitized[id] = { ...t };
    }
    if (Object.keys(sanitized).length === 0) return;
    const existingIdx = presets.findIndex((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    const id =
      existingIdx >= 0
        ? presets[existingIdx]?.id
        : `pst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const preset: DriverTweakPreset = {
      id,
      name: trimmed,
      savedAt: Date.now(),
      tweaks: sanitized,
    };
    const next =
      existingIdx >= 0
        ? presets.map((p, i) => (i === existingIdx ? preset : p))
        : [preset, ...presets];
    persist(next);
    setName('');
    setSelectedId(id);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1500);
  }, [name, currentTweaks, presets, persist]);

  const loadPreset = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!id) return;
      const p = presets.find((x) => x.id === id);
      if (!p) return;
      const restored: Record<string, DriverTweak> = {};
      for (const [k, v] of Object.entries(p.tweaks)) {
        restored[k] = { ...IDENTITY_TWEAK, ...v };
      }
      onLoad(restored);
    },
    [presets, onLoad],
  );

  const deletePreset = useCallback(
    (id: string) => {
      const next = presets.filter((p) => p.id !== id);
      persist(next);
      if (selectedId === id) setSelectedId('');
    },
    [presets, persist, selectedId],
  );

  return (
    <div
      className="flex items-center gap-2 flex-wrap rounded-md px-2 py-1.5"
      style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${accentColor}25` }}
    >
      <Bookmark className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />
      <span
        className="text-[9px] uppercase tracking-wider font-semibold flex-shrink-0"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Scenarios
      </span>
      <select
        value={selectedId}
        onChange={(e) => loadPreset(e.target.value)}
        disabled={presets.length === 0}
        className="text-[10px] bg-transparent border rounded px-1.5 py-1 font-mono text-white/80 disabled:opacity-40"
        style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        aria-label="Load saved driver-tweak scenario"
      >
        <option value="" className="bg-black">
          {presets.length === 0 ? 'No saved scenarios' : 'Load scenario…'}
        </option>
        {presets.map((p) => (
          <option key={p.id} value={p.id} className="bg-black">
            {p.name}
          </option>
        ))}
      </select>
      {selectedId && (
        <button
          onClick={() => deletePreset(selectedId)}
          className="flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-1 text-white/60 hover:text-white transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          aria-label="Delete selected scenario"
          title="Delete selected scenario"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              savePreset();
            }
          }}
          placeholder="Name this scenario"
          maxLength={48}
          className="text-[10px] bg-transparent border rounded px-1.5 py-1 font-mono text-white placeholder-white/30 w-40"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          aria-label="New scenario name"
        />
        <button
          onClick={savePreset}
          disabled={!name.trim() || !hasOverrides}
          className="flex items-center gap-1 text-[10px] font-semibold rounded px-2 py-1 transition-colors disabled:opacity-40"
          style={{ background: accentColor, color: '#000' }}
          aria-label="Save current driver tweaks as a scenario"
          title={
            !hasOverrides
              ? 'Adjust at least one driver to save'
              : !name.trim()
                ? 'Give the scenario a name'
                : 'Save scenario'
          }
        >
          {justSaved ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {justSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}
