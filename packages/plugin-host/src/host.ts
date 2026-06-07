import type {
  PluginDefinition,
  PluginEventContext,
  PluginRegistration,
  PluginValidationResult,
} from './types.js';
import { REQUIRED_CAPABILITIES } from './capabilities.js';

function validate(definition: PluginDefinition): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!definition.slug || !/^[a-z0-9-]+$/.test(definition.slug)) {
    errors.push('slug must be lowercase alphanumeric with dashes');
  }

  if (!definition.name || definition.name.trim().length === 0) {
    errors.push('name is required');
  }

  if (!definition.version || !/^\d+\.\d+\.\d+$/.test(definition.version)) {
    errors.push('version must follow semver (e.g. 1.0.0)');
  }

  const missingRequired = REQUIRED_CAPABILITIES.filter(
    (cap) => !definition.capabilities.includes(cap),
  );
  if (missingRequired.length > 0) {
    errors.push(`Missing required capabilities: ${missingRequired.join(', ')}`);
  }

  if (!definition.governanceInherited) {
    errors.push(
      'governanceInherited must be true — platform governance cannot be opted out of',
    );
  }

  if (!definition.proofChainEnabled) {
    errors.push(
      'proofChainEnabled must be true — proof chain is required for all platform modules',
    );
  }

  if (!definition.capabilities.includes('ui:command-card')) {
    warnings.push(
      'Recommended: implement ui:command-card to appear in the unified command center',
    );
  }

  if (!definition.capabilities.includes('api:public')) {
    warnings.push('Recommended: implement api:public to expose data through the public API v1');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export class PluginHost {
  private static instance: PluginHost | null = null;
  private readonly plugins = new Map<string, PluginRegistration>();

  static getInstance(): PluginHost {
    if (!PluginHost.instance) {
      PluginHost.instance = new PluginHost();
    }
    return PluginHost.instance;
  }

  register(definition: PluginDefinition): PluginRegistration {
    const validationResult = validate(definition);

    if (!validationResult.valid) {
      throw new Error(
        `Plugin '${definition.slug}' failed contract validation:\n` +
          validationResult.errors.map((e) => `  - ${e}`).join('\n'),
      );
    }

    if (this.plugins.has(definition.slug)) {
      throw new Error(
        `Plugin '${definition.slug}' is already registered. Use a unique slug.`,
      );
    }

    const registration: PluginRegistration = {
      definition,
      registeredAt: new Date(),
      validationResult,
    };

    this.plugins.set(definition.slug, registration);

    if (validationResult.warnings.length > 0) {
      console.warn(
        `[PluginHost] Plugin '${definition.slug}' registered with warnings:\n` +
          validationResult.warnings.map((w) => `  - ${w}`).join('\n'),
      );
    }

    return registration;
  }

  unregister(slug: string): boolean {
    return this.plugins.delete(slug);
  }

  get(slug: string): PluginRegistration | undefined {
    return this.plugins.get(slug);
  }

  list(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  async emit(event: PluginEventContext): Promise<void> {
    const handlers = Array.from(this.plugins.values())
      .filter((p) => typeof p.definition.onEvent === 'function');

    await Promise.allSettled(
      handlers.map((p) => p.definition.onEvent!(event)),
    );
  }

  async install(slug: string, orgId: number, config: Record<string, unknown> = {}): Promise<void> {
    const registration = this.plugins.get(slug);
    if (!registration) throw new Error(`Plugin '${slug}' is not registered`);

    if (typeof registration.definition.onInstall === 'function') {
      await registration.definition.onInstall({ orgId, config });
    }
  }

  async uninstall(slug: string, orgId: number, config: Record<string, unknown> = {}): Promise<void> {
    const registration = this.plugins.get(slug);
    if (!registration) throw new Error(`Plugin '${slug}' is not registered`);

    if (typeof registration.definition.onUninstall === 'function') {
      await registration.definition.onUninstall({ orgId, config });
    }
  }
}
