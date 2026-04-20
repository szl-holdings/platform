function getCsrfToken(): string {
  const match =
    typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) : null;
  return match ? decodeURIComponent(match[1] ?? '') : '';
}

async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    await fetch('/api/csrf-token', { credentials: 'include' });
  } catch {
    return '';
  }
  return getCsrfToken();
}

export async function postPolicyAppeal(body: Record<string, unknown>): Promise<void> {
  const token = await ensureCsrfToken();
  let res: Response;
  try {
    res = await fetch('/api/audit-log/policy-appeal', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-csrf-token': token } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[policy-appeal] network error', err);
    if (typeof window !== 'undefined') {
      window.alert('Could not reach the audit log. Please try again.');
    }
    return;
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[policy-appeal] request failed', res.status, detail);
    if (typeof window !== 'undefined') {
      window.alert(`Submission failed (HTTP ${res.status}). Your appeal was not recorded.`);
    }
  }
}
