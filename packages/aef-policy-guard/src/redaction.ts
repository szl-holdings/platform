export type RedactionHook = (value: unknown, fieldName: string, tenantId: string) => unknown;

export class RedactionRegistry {
  private readonly hooks = new Map<string, RedactionHook>();
  private readonly defaultMask = '[REDACTED]';

  registerHook(fieldName: string, hook: RedactionHook): void {
    this.hooks.set(fieldName, hook);
  }

  applyRedactions(
    record: Record<string, unknown>,
    fields: string[],
    tenantId: string,
  ): Record<string, unknown> {
    if (fields.length === 0) return record;

    const result = { ...record };
    for (const field of fields) {
      if (!(field in result)) continue;

      const hook = this.hooks.get(field);
      if (hook) {
        result[field] = hook(result[field], field, tenantId);
      } else {
        result[field] = this.defaultMask;
      }
    }
    return result;
  }

  hasHook(fieldName: string): boolean {
    return this.hooks.has(fieldName);
  }
}
