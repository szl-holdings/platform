import type { HttpClient } from '../http.js';
import type { LambdaGate } from '../lambda-gate.js';
import type { PaginationOptions, TreasuryAccount, TreasuryBalance, TreasurySummary } from '../types.js';

export interface TreasuryTransfer {
  id: string;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  currency: string;
  status: 'pending' | 'submitted' | 'settled' | 'failed';
  createdAt: string;
}

export class TreasuryResource {
  constructor(
    private readonly http: HttpClient,
    private readonly gate?: LambdaGate,
  ) {}

  async addAccount(options: {
    label: string;
    currency: string;
    currencyType: 'fiat' | 'stablecoin' | 'crypto';
    network?: string;
    walletAddress?: string;
    provider?: 'coinbase_commerce' | 'coinbase_prime' | 'fireblocks' | 'internal';
  }): Promise<TreasuryAccount> {
    return this.http.post<TreasuryAccount>('/treasury/accounts', options);
  }

  async listAccounts(): Promise<TreasuryAccount[]> {
    return this.http.get<TreasuryAccount[]>('/treasury/accounts');
  }

  async getBalances(): Promise<{ accounts: TreasuryBalance[]; totalUsd: string; lastRefreshed: string }> {
    return this.http.get('/treasury/balances');
  }

  async refreshBalances(): Promise<{ refreshed: boolean; snapshotsCreated: number; refreshedAt: string }> {
    return this.http.post('/treasury/balances/refresh');
  }

  async getSummary(): Promise<TreasurySummary> {
    return this.http.get<TreasurySummary>('/treasury/summary');
  }

  async listTransactions(
    options: PaginationOptions & { accountId?: number } = {},
  ): Promise<unknown[]> {
    return this.http.get('/treasury/transactions', options);
  }

  async transfer(options: {
    fromAccountId: number;
    toAccountId: number;
    amount: string;
    currency: string;
    memo?: string;
    approvalToken?: string;
  }): Promise<TreasuryTransfer> {
    const { approvalToken, ...body } = options;
    const gateDecision = this.gate
      ? await this.gate.check('treasury.transfer', { approvalToken })
      : undefined;
    return this.http.request<TreasuryTransfer>('POST', '/treasury/transfers', {
      body,
      ...(gateDecision ? { gateDecision } : {}),
    });
  }
}
