import { StateNativeError } from './errors.js';
import type { PortableStateObject, StateTransportAdapter } from './types.js';

export class InMemoryStateTransportAdapter implements StateTransportAdapter {
  public readonly name: string;
  readonly #objects = new Map<string, PortableStateObject>();

  public constructor(name = 'in-memory-transport') {
    if (name.trim().length === 0) {
      throw new StateNativeError('INVALID_INPUT', 'Transport adapter name must not be empty.');
    }
    this.name = name;
  }

  public async put(object: PortableStateObject): Promise<void> {
    this.#objects.set(object.capsule.capsuleId, {
      capsule: object.capsule,
      payload: Uint8Array.from(object.payload),
    });
  }

  public async get(capsuleId: string): Promise<PortableStateObject | undefined> {
    const object = this.#objects.get(capsuleId);
    if (!object) {
      return undefined;
    }
    return { capsule: object.capsule, payload: Uint8Array.from(object.payload) };
  }

  public async delete(capsuleId: string): Promise<void> {
    this.#objects.delete(capsuleId);
  }

  public count(): number {
    return this.#objects.size;
  }
}
