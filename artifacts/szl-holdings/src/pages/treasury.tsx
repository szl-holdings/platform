import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bitcoin,
  Coins,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface TreasuryAccount {
  id: number;
  label: string;
  currency: string;
  currencyType: 'fiat' | 'stablecoin' | 'crypto';
  network?: string;
  provider: string;
}

interface TreasuryBalance {
  account: TreasuryAccount;
  balance: string;
  balanceUsd: string;
  lastUpdated: string | null;
}

interface TreasurySummary {
  fiat: { totalUsd: string; accounts: number };
  stablecoin: { totalUsd: string; accounts: number };
  combined: { totalUsd: string };
  lastRefreshed: string;
}

interface TreasuryTransaction {
  id: number;
  txType: string;
  amount: string;
  currency: string;
  amountUsd?: string;
  description?: string;
  status: string;
  occurredAt: string;
}

const CURRENCY_ICONS: Record<string, React.ReactNode> = {
  USDC: <Coins className="w-5 h-5 text-blue-400" />,
  USDT: <Coins className="w-5 h-5 text-emerald-400" />,
  DAI: <Coins className="w-5 h-5 text-amber-400" />,
  BTC: <Bitcoin className="w-5 h-5 text-orange-400" />,
  USD: <DollarSign className="w-5 h-5 text-emerald-400" />,
  EUR: <DollarSign className="w-5 h-5 text-blue-400" />,
  GBP: <DollarSign className="w-5 h-5 text-purple-400" />,
};

const TYPE_COLORS: Record<string, string> = {
  stablecoin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  fiat: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  crypto: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const TX_TYPE_COLORS: Record<string, string> = {
  credit: 'text-emerald-400',
  debit: 'text-red-400',
  transfer: 'text-blue-400',
  fee: 'text-zinc-400',
  yield: 'text-violet-400',
};

function formatCurrency(amount: string, usd?: string | null): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  if (usd) {
    return `$${parseFloat(usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

export default function TreasuryPage() {
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [balances, setBalances] = useState<TreasuryBalance[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'transactions'>('overview');

  const load = async () => {
    try {
      const [summaryRes, balancesRes, txRes] = await Promise.all([
        apiRequest('GET', '/api/treasury/summary'),
        apiRequest('GET', '/api/treasury/balances'),
        apiRequest('GET', '/api/treasury/transactions?limit=20'),
      ]);

      const summaryData = await summaryRes.json();
      const balancesData = await balancesRes.json();
      const txData = await txRes.json();

      setSummary(summaryData.data ?? summaryData);
      setBalances(balancesData.data?.accounts ?? balancesData.accounts ?? []);
      setTransactions(txData.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiRequest('POST', '/api/treasury/balances/refresh');
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-semibold">Treasury</h1>
            </div>
            <p className="text-sm text-zinc-400">
              Stablecoin and fiat balances in a unified view.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Balances'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-900/60 border border-zinc-700/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-zinc-400">Stablecoin</p>
                </div>
                <p className="text-2xl font-semibold text-blue-300">
                  ${parseFloat(summary?.stablecoin.totalUsd ?? '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{summary?.stablecoin.accounts ?? 0} accounts</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-zinc-400">Fiat</p>
                </div>
                <p className="text-2xl font-semibold text-emerald-300">
                  ${parseFloat(summary?.fiat.totalUsd ?? '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{summary?.fiat.accounts ?? 0} accounts</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs text-zinc-400">Combined Total</p>
                </div>
                <p className="text-2xl font-semibold text-white">
                  ${parseFloat(summary?.combined.totalUsd ?? '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {summary?.lastRefreshed ? `Updated ${new Date(summary.lastRefreshed).toLocaleTimeString()}` : 'Not refreshed'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-zinc-700/30 pb-0">
              {(['overview', 'transactions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === t
                      ? 'text-indigo-400 border-indigo-400'
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                {balances.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                    <Wallet className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">No treasury accounts configured</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Add accounts via the API or contact your administrator
                    </p>
                  </div>
                ) : (
                  balances.map((b) => (
                    <div
                      key={b.account.id}
                      className="bg-zinc-900/60 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {CURRENCY_ICONS[b.account.currency] ?? <Coins className="w-5 h-5 text-zinc-400" />}
                          <div>
                            <p className="text-sm font-medium text-white">{b.account.label}</p>
                            <p className="text-xs text-zinc-500">{b.account.currency}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${TYPE_COLORS[b.account.currencyType] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}
                        >
                          {b.account.currencyType}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xl font-semibold text-white">
                          {formatCurrency(b.balance)}
                          <span className="text-sm text-zinc-400 ml-1">{b.account.currency}</span>
                        </p>
                        {b.balanceUsd && parseFloat(b.balanceUsd) > 0 && b.account.currencyType !== 'fiat' && (
                          <p className="text-sm text-zinc-400 mt-0.5">
                            ≈ ${parseFloat(b.balanceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </p>
                        )}
                        {b.account.network && (
                          <p className="text-xs text-zinc-600 mt-1">{b.account.network}</p>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-700/30 flex items-center justify-between">
                        <p className="text-xs text-zinc-600">via {b.account.provider}</p>
                        {b.lastUpdated && (
                          <p className="text-xs text-zinc-600">
                            {new Date(b.lastUpdated).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'transactions' && (
              <div className="bg-zinc-900/60 border border-zinc-700/30 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-700/30">
                  <h2 className="text-sm font-medium text-zinc-200">Recent Transactions</h2>
                </div>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-700/20">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="px-5 py-3 flex items-center gap-4">
                        <div className="shrink-0">
                          {tx.txType === 'credit' ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {tx.description ?? tx.txType.charAt(0).toUpperCase() + tx.txType.slice(1)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(tx.occurredAt).toLocaleDateString()} · {tx.status}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-medium ${TX_TYPE_COLORS[tx.txType] ?? 'text-zinc-300'}`}>
                            {tx.txType === 'debit' ? '-' : '+'}
                            {tx.amount} {tx.currency}
                          </p>
                          {tx.amountUsd && (
                            <p className="text-xs text-zinc-500">
                              ${parseFloat(tx.amountUsd).toFixed(2)} USD
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
