import type { SelfModelState } from './types.js';

/**
 * Persistence adapter interface — consumers inject a concrete implementation
 * (e.g. a Drizzle/pool adapter) so the package can persist without knowing
 * which database driver is in use.
 */
export interface SelfModelPersistenceAdapter {
  saveModel(agentId: string, model: SelfModelState): Promise<void>;
  saveSnapshot(
    agentId: string,
    model: SelfModelState,
    changeReason?: string,
    triggeredBy?: string,
  ): Promise<void>;
  loadModel(agentId: string): Promise<SelfModelState | null>;
  loadHistory(agentId: string, limit?: number, offset?: number): Promise<SelfModelState[]>;
  loadAll(): Promise<SelfModelState[]>;
}

/**
 * No-op persistence adapter — used as the default when no adapter is injected.
 * All operations succeed silently without writing anywhere.
 */
export class NoOpPersistenceAdapter implements SelfModelPersistenceAdapter {
  async saveModel(_agentId: string, _model: SelfModelState): Promise<void> {}
  async saveSnapshot(
    _agentId: string,
    _model: SelfModelState,
    _changeReason?: string,
    _triggeredBy?: string,
  ): Promise<void> {}
  async loadModel(_agentId: string): Promise<SelfModelState | null> {
    return null;
  }
  async loadHistory(
    _agentId: string,
    _limit?: number,
    _offset?: number,
  ): Promise<SelfModelState[]> {
    return [];
  }
  async loadAll(): Promise<SelfModelState[]> {
    return [];
  }
}
