/**
 * MarketTicker component tests
 *
 * Covers:
 *  - stale icon visibility (both full and compact modes)
 *  - provider / asOf / delayWindow display in full mode
 *  - compact mode metadata (inline text + title attribute)
 *  - seed mode badge rendering
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketTicker } from '../components/MarketTicker';
import type { MacroIndicator, MarketDataSnapshot } from '../data/market-api';

function makeIndicator(overrides: Partial<MacroIndicator> = {}): MacroIndicator {
  return {
    id: 'test-spy500',
    label: 'SPY',
    category: 'equity',
    value: 5100.5,
    formattedValue: '5,100.50',
    change: 12.3,
    changePct: 0.24,
    unit: 'USD',
    asOf: '2025-04-25T20:00:00.000Z',
    provider: 'Alpha Vantage',
    delayWindow: 'EOD',
    staleThresholdHours: 26,
    isStale: false,
    dataQuality: 'eod',
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<MarketDataSnapshot> = {}): MarketDataSnapshot {
  return {
    indicators: [makeIndicator()],
    refreshedAt: '2025-04-25T21:00:00.000Z',
    nextRefreshAt: '2025-04-26T04:00:00.000Z',
    providerConfigured: true,
    cacheAgeSeconds: 60,
    isStale: false,
    provider: 'Alpha Vantage',
    ...overrides,
  };
}

describe('MarketTicker — full mode', () => {
  it('renders the indicator label and value', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    expect(screen.getByText('SPY')).toBeTruthy();
    expect(screen.getByText('5,100.50')).toBeTruthy();
  });

  it('shows provider in the indicator pill', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    const providerElements = screen.getAllByText('Alpha Vantage');
    expect(providerElements.length).toBeGreaterThan(0);
  });

  it('shows delayWindow in the indicator pill', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    const delayWindowElements = screen.getAllByText('EOD');
    expect(delayWindowElements.length).toBeGreaterThan(0);
  });

  it('does NOT show stale icon when indicator is fresh', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    expect(screen.queryByLabelText('stale')).toBeNull();
    const alertIcons = document.querySelectorAll('[aria-label="stale"]');
    expect(alertIcons).toHaveLength(0);
  });

  it('shows stale icon when indicator.isStale is true', () => {
    const staleIndicator = makeIndicator({ isStale: true });
    render(<MarketTicker snapshot={makeSnapshot({ indicators: [staleIndicator], isStale: true })} />);
    const alertIcons = document.querySelectorAll('[aria-label="stale"]');
    expect(alertIcons.length).toBeGreaterThan(0);
  });

  it('shows STALE count badge in header when indicators are stale', () => {
    const staleIndicator = makeIndicator({ isStale: true });
    render(
      <MarketTicker
        snapshot={makeSnapshot({ indicators: [staleIndicator], isStale: true })}
      />,
    );
    expect(screen.getByText(/1 STALE/i)).toBeTruthy();
  });

  it('shows SEED badge when provider is seed', () => {
    const seedIndicator = makeIndicator({ dataQuality: 'seed', provider: 'seed' });
    render(
      <MarketTicker
        snapshot={makeSnapshot({
          indicators: [seedIndicator],
          provider: 'seed',
          providerConfigured: false,
        })}
      />,
    );
    const seedBadges = screen.getAllByText(/SEED/i);
    expect(seedBadges.length).toBeGreaterThan(0);
  });

  it('does NOT show SEED badge when provider is configured', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    const seedBadges = screen.queryAllByText(/SEED · Configure/i);
    expect(seedBadges).toHaveLength(0);
  });

  it('indicator pill title attribute contains provider, delayWindow, and asOf', () => {
    render(<MarketTicker snapshot={makeSnapshot()} />);
    const pillWithTitle = document.querySelector('[title*="Alpha Vantage"]');
    expect(pillWithTitle).toBeTruthy();
    expect(pillWithTitle?.getAttribute('title')).toMatch(/EOD/);
  });

  it('shows "Refreshed" footer with cache age', () => {
    render(<MarketTicker snapshot={makeSnapshot({ cacheAgeSeconds: 180 })} />);
    expect(screen.getByText(/Cache 3m old/i)).toBeTruthy();
  });
});

describe('MarketTicker — compact mode', () => {
  it('renders label and value in compact mode', () => {
    render(<MarketTicker snapshot={makeSnapshot()} compact />);
    expect(screen.getByText('SPY')).toBeTruthy();
    expect(screen.getByText('5,100.50')).toBeTruthy();
  });

  it('shows delayWindow inline in compact mode', () => {
    render(<MarketTicker snapshot={makeSnapshot()} compact />);
    const delayEls = screen.getAllByText('EOD');
    expect(delayEls.length).toBeGreaterThan(0);
  });

  it('shows provider inline in compact mode', () => {
    render(<MarketTicker snapshot={makeSnapshot()} compact />);
    const providerEls = screen.getAllByText('Alpha Vantage');
    expect(providerEls.length).toBeGreaterThan(0);
  });

  it('compact item title attribute contains provider, delayWindow, and asOf', () => {
    render(<MarketTicker snapshot={makeSnapshot()} compact />);
    const itemWithTitle = document.querySelector('[data-provider="Alpha Vantage"]');
    expect(itemWithTitle).toBeTruthy();
    const title = itemWithTitle?.getAttribute('title') ?? '';
    expect(title).toMatch(/Alpha Vantage/);
    expect(title).toMatch(/EOD/);
  });

  it('stores as-of ISO string in data-as-of attribute in compact mode', () => {
    const asOf = '2025-04-25T20:00:00.000Z';
    const ind = makeIndicator({ asOf });
    render(<MarketTicker snapshot={makeSnapshot({ indicators: [ind] })} compact />);
    const item = document.querySelector('[data-as-of]');
    expect(item?.getAttribute('data-as-of')).toBe(asOf);
  });

  it('shows stale icon in compact mode when isStale is true', () => {
    const staleIndicator = makeIndicator({ isStale: true });
    render(
      <MarketTicker
        snapshot={makeSnapshot({ indicators: [staleIndicator] })}
        compact
      />,
    );
    const alertIcons = document.querySelectorAll('[aria-label="stale"]');
    expect(alertIcons.length).toBeGreaterThan(0);
  });

  it('does NOT show stale icon in compact mode when fresh', () => {
    render(<MarketTicker snapshot={makeSnapshot()} compact />);
    const alertIcons = document.querySelectorAll('[aria-label="stale"]');
    expect(alertIcons).toHaveLength(0);
  });

  it('limits compact mode to at most 6 indicators', () => {
    const indicators = Array.from({ length: 10 }, (_, i) =>
      makeIndicator({ id: `ind-${i}`, label: `IND${i}` }),
    );
    render(<MarketTicker snapshot={makeSnapshot({ indicators })} compact />);
    const items = document.querySelectorAll('[data-provider]');
    expect(items.length).toBeLessThanOrEqual(6);
  });
});
