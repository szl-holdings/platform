const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : "";
}

export async function apiRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  let csrfToken = needsCsrf ? getCsrfTokenFromCookie() : "";
  if (needsCsrf && !csrfToken) {
    try {
      await fetch(`${BASE}/api/csrf-token`, { credentials: "include" });
      csrfToken = getCsrfTokenFromCookie();
    } catch {
      // ignore — request may still succeed for exempt endpoints
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      ...(needsCsrf && csrfToken ? { "x-csrf-token": csrfToken } : {}),
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
