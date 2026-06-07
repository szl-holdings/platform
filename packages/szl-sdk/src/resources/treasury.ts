import type { HttpClient } from '../http.js';
import type { PaginationOptions, TreasuryAccount, TreasuryBalance, TreasurySummary } from '../types.js';

export class TreasuryResource {
  constructor(private readonly http: HttpClient) {}

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
}
