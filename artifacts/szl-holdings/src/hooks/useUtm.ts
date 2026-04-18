import { useEffect, useState } from "react";

export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

const UTM_KEYS: (keyof UtmParams)[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
const SESSION_KEY = "szl_utm";

function readFromUrl(): Partial<UtmParams> {
  const params = new URLSearchParams(window.location.search);
  const result: Partial<UtmParams> = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) result[key] = val;
  }
  return result;
}

function readFromSession(): Partial<UtmParams> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<UtmParams>;
  } catch {
    return {};
  }
}

function saveToSession(params: Partial<UtmParams>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(params));
  } catch {
  }
}

export function useUtm(): Partial<UtmParams> {
  const [utms, setUtms] = useState<Partial<UtmParams>>({});

  useEffect(() => {
    const fromUrl = readFromUrl();
    const fromSession = readFromSession();
    if (Object.keys(fromUrl).length > 0) {
      const merged = { ...fromSession, ...fromUrl };
      saveToSession(merged);
      setUtms(merged);
    } else {
      setUtms(fromSession);
    }
  }, []);

  return utms;
}
