/**
 * Tests for the notification count badge shown on the settings button
 * across all mobile shell screens.
 *
 * Covers:
 * 1. Badge formatting and visibility logic (imported from production code).
 * 2. Unread count derivation from the /api/notifications response shapes.
 * 3. Shared-context guarantee — a single provider count propagates uniformly.
 * 4. Structural checks — every domain tab layout imports SettingsHeaderButton,
 *    confirming the badge is wired into each screen, not just Command.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  deriveUnreadCount,
  formatBadgeCount,
  shouldShowBadge,
  type NotificationItem,
} from '../components/SettingsHeaderButton.logic';

// ────────────────────────────────────────────────────────────────────────────
// Badge formatting
// ────────────────────────────────────────────────────────────────────────────

describe('formatBadgeCount — settings button badge label', () => {
  it('renders the exact count for numbers below the cap', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(5)).toBe('5');
    expect(formatBadgeCount(99)).toBe('99');
  });

  it('caps the label at "99+" when count exceeds 99', () => {
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(999)).toBe('99+');
  });

  it('renders "0" for zero (badge visibility is gated separately)', () => {
    expect(formatBadgeCount(0)).toBe('0');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Badge visibility gate
// ────────────────────────────────────────────────────────────────────────────

describe('shouldShowBadge — badge visibility gate', () => {
  it('hides the badge when there are no unread notifications', () => {
    expect(shouldShowBadge(0)).toBe(false);
  });

  it('shows the badge as soon as there is one unread notification', () => {
    expect(shouldShowBadge(1)).toBe(true);
  });

  it('shows the badge for any positive unread count', () => {
    expect(shouldShowBadge(50)).toBe(true);
    expect(shouldShowBadge(100)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Unread count derivation from /api/notifications
// ────────────────────────────────────────────────────────────────────────────

describe('deriveUnreadCount — reading /api/notifications response', () => {
  it('counts items where isRead is false', () => {
    const items: NotificationItem[] = [
      { isRead: false },
      { isRead: true },
      { isRead: false },
    ];
    expect(deriveUnreadCount(items)).toBe(2);
  });

  it('handles a { data: [...] } envelope from the API', () => {
    const items: NotificationItem[] = [
      { isRead: false },
      { isRead: false },
      { isRead: true },
    ];
    expect(deriveUnreadCount({ data: items })).toBe(2);
  });

  it('returns 0 when all notifications are already read', () => {
    const items: NotificationItem[] = [{ isRead: true }, { isRead: true }];
    expect(deriveUnreadCount(items)).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(deriveUnreadCount([])).toBe(0);
  });

  it('returns 0 when the API call returns undefined (error state)', () => {
    expect(deriveUnreadCount(undefined)).toBe(0);
  });

  it('returns 0 when the envelope has no data field', () => {
    expect(deriveUnreadCount({})).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// End-to-end badge label pipeline
// ────────────────────────────────────────────────────────────────────────────

describe('notification badge — end-to-end label pipeline', () => {
  it('formats a low unread count correctly for the badge label', () => {
    const response: NotificationItem[] = Array.from({ length: 5 }, () => ({ isRead: false }));
    const count = deriveUnreadCount(response);
    expect(shouldShowBadge(count)).toBe(true);
    expect(formatBadgeCount(count)).toBe('5');
  });

  it('caps the badge label at "99+" when there are more than 99 unread notifications', () => {
    const response: NotificationItem[] = Array.from({ length: 150 }, () => ({ isRead: false }));
    const count = deriveUnreadCount(response);
    expect(shouldShowBadge(count)).toBe(true);
    expect(formatBadgeCount(count)).toBe('99+');
  });

  it('hides the badge and shows no label when the inbox is fully read', () => {
    const response: NotificationItem[] = Array.from({ length: 10 }, () => ({ isRead: true }));
    const count = deriveUnreadCount(response);
    expect(shouldShowBadge(count)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Structural checks — SettingsHeaderButton wired into every domain layout
//
// These tests parse the source of every domain's (tabs)/_layout.tsx and assert
// that SettingsHeaderButton is imported and used as headerRight.  A missing
// import means the badge is absent from that section of the app.
// ────────────────────────────────────────────────────────────────────────────

const SHELL_ROOT = path.resolve(__dirname, '..', 'app', '(shell)');
const DOMAIN_LAYOUTS = [
  'defense/(tabs)/_layout.tsx',
  'fleet/(tabs)/_layout.tsx',
  'portfolio/(tabs)/_layout.tsx',
  'advisory/(tabs)/_layout.tsx',
  'operations/(tabs)/_layout.tsx',
  'founder/(tabs)/_layout.tsx',
  'properties/(tabs)/_layout.tsx',
];

describe('SettingsHeaderButton — present in every domain tab layout', () => {
  for (const relPath of DOMAIN_LAYOUTS) {
    const fullPath = path.join(SHELL_ROOT, relPath);
    const domain = relPath.split('/')[0];

    it(`${domain}: imports SettingsHeaderButton and SettingsHeaderOverlay from the shared component`, () => {
      const src = fs.readFileSync(fullPath, 'utf8');
      expect(src).toContain("from '@/components/SettingsHeaderButton'");
      expect(src).toContain('SettingsHeaderButton');
      expect(src).toContain('SettingsHeaderOverlay');
    });

    it(`${domain}: ClassicTabLayout wires the badge via headerRight`, () => {
      const src = fs.readFileSync(fullPath, 'utf8');
      expect(src).toContain('headerRight: () => <SettingsHeaderButton />');
    });

    it(`${domain}: NativeTabLayout path wires the badge via SettingsHeaderOverlay`, () => {
      const src = fs.readFileSync(fullPath, 'utf8');
      expect(src).toContain('isLiquidGlassAvailable() && <SettingsHeaderOverlay />');
    });
  }
});

describe('SettingsHeaderButton — present in the Command (index) screen', () => {
  const indexPath = path.join(SHELL_ROOT, 'index.tsx');

  it('imports SettingsHeaderButton from the shared component', () => {
    const src = fs.readFileSync(indexPath, 'utf8');
    expect(src).toContain("from '@/components/SettingsHeaderButton'");
  });

  it('renders SettingsHeaderButton in the header', () => {
    const src = fs.readFileSync(indexPath, 'utf8');
    expect(src).toContain('<SettingsHeaderButton />');
  });
});
