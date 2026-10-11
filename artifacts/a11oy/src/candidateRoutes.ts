export const REVIEWED_PUBLIC_ROUTES = [
  { path: '/', label: 'Candidate home' },
  { path: '/security-agents', label: 'Security-agent fixture' },
] as const;

export function routeHref(base: string, path: string) {
  return path === '/' ? `${base}/` || '/' : `${base}${path}`;
}
