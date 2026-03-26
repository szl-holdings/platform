---
applyTo: "artifacts/**/*.{ts,tsx,jsx,css}"
---

## Frontend conventions (React 19 + Vite 7 + Tailwind CSS 4)

- Use React 19 features: `use()` hook, `useTransition`, `useOptimistic`, `<Suspense>` boundaries.
- Prefer function components with TypeScript interfaces for props.
- Use `wouter` for client-side routing (`useRoute`, `useLocation`, `<Route>`).
- Use `@tanstack/react-query` (`useQuery`, `useMutation`) for server state — never `useEffect` + `fetch`.
- Import generated API hooks from `@workspace/api-client-react`.

### Styling

- Tailwind CSS 4 utility classes — no CSS modules or styled-components.
- Use `class-variance-authority` (cva) for component variant props.
- Merge classes with `cn()` helper from the app's `lib/utils` (uses `clsx` + `tailwind-merge`).
- Radix UI primitives for accessible interactive components (Dialog, Dropdown, Tabs, etc.).
- shadcn/ui patterns: components live in each app's `src/components/ui/`.

### Build & dependencies

- Each app has its own `vite.config.ts` — import plugins from `@vitejs/plugin-react`, `@tailwindcss/vite`.
- Use `catalog:` version references in `package.json` for shared dependencies.
- Use `workspace:*` for internal `@workspace/*` packages.
- Port is read from the `PORT` environment variable.
