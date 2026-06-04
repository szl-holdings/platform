// CSS module type declarations for side-effect imports (e.g. @uppy/* CSS).
// TS2882 fires when TypeScript cannot find module declarations for CSS imports
// that are consumed as side effects (no binding). This declaration satisfies
// the compiler without requiring a bundler-specific plugin.
declare module '*.css' {
  const stylesheet: string;
  export default stylesheet;
}
