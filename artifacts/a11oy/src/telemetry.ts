export function recordSpan(_attrs: Record<string, unknown>): void {}

export function withSpan<T>(
  _name: string,
  _attrs: Record<string, unknown>,
  fn: () => T,
): T {
  return fn();
}
