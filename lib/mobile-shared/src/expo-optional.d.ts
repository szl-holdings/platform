// The Expo runtime is an optional peer of mobile-shared. Keep this declaration
// limited to the API used by ErrorFallback while its package is absent here.
declare module 'expo' {
  export function reloadAppAsync(reason?: string): void | Promise<void>;
}
