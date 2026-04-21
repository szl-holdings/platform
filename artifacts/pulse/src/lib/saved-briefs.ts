const STORAGE_KEY = 'pulse-saved-briefs';

export function getSavedBriefIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveBrief(id: string): void {
  const ids = getSavedBriefIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function unsaveBrief(id: string): void {
  const ids = getSavedBriefIds();
  ids.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function toggleSavedBrief(id: string): boolean {
  const ids = getSavedBriefIds();
  if (ids.has(id)) {
    ids.delete(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    return false;
  } else {
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    return true;
  }
}
